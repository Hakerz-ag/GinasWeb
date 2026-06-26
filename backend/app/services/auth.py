"""Auth helpers — password hashing, JWT token creation/verification, and refresh tokens."""

from datetime import datetime, timedelta
from jose import jwt, JWTError
import bcrypt
import secrets

from app.config import get_settings

settings = get_settings()


# ── Password hashing ────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    """Hash a plaintext password using bcrypt."""
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    """Check a plaintext password against a bcrypt hash."""
    return bcrypt.checkpw(plain.encode(), hashed.encode())


# ── JWT tokens with key versioning (kid) ─────────────────────────────────────
# Supports JWT_SECRET rotation: maintain current key + previous key.
# New tokens are signed with the current key. During verification, we try
# the current key first, then fall back to the previous key. This allows
# seamless rotation without mass logout.

# The "kid" (key ID) in the JWT header identifies which key was used.
# kid="1" = primary key (JWT_SECRET), kid="0" = previous key (JWT_SECRET_PREV)

def _get_signing_keys() -> dict:
    """Return the current and previous signing keys.
    
    JWT_SECRET is the current key.
    JWT_SECRET_PREV (optional) is the previous key, kept around during rotation
    so that tokens signed with it remain valid until they expire.
    """
    return {
        "1": settings.jwt_secret,                          # current key
        "0": getattr(settings, 'jwt_secret_prev', None) or settings.jwt_secret,  # previous key (fallback to current if not set)
    }


def create_token(user_id: str, role: str, expire_minutes: int = None) -> str:
    """Create a short-lived access JWT token with user_id and role claims.
    
    Access tokens are short-lived (default 15 min) and used for API authentication.
    They are NOT stored in the database — use refresh tokens for long sessions.
    
    Args:
        user_id: The user's ID
        role: The user's role (admin/customer)
        expire_minutes: Custom expiry in minutes. Defaults to 15 minutes.
    """
    minutes = expire_minutes if expire_minutes is not None else 15
    expire = datetime.utcnow() + timedelta(minutes=minutes)
    payload = {"sub": user_id, "role": role, "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm, headers={"kid": "1"})


def create_refresh_token(user_id: str, role: str) -> str:
    """Create a long-lived refresh JWT token.
    
    Refresh tokens are long-lived (7 days) and used ONLY to obtain new access tokens.
    They are also stored in the database so they can be revoked (e.g., on logout).
    """
    expire = datetime.utcnow() + timedelta(days=7)
    payload = {"sub": user_id, "role": role, "exp": expire, "type": "refresh", "jti": secrets.token_hex(16)}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm, headers={"kid": "1"})


def decode_token(token: str) -> "dict | None":
    """Decode and verify a JWT token. Returns payload or None if invalid.
    
    Supports key rotation: tries the current key first (kid="1"), then the
    previous key (kid="0") if the token was signed during a rotation window.
    """
    keys = _get_signing_keys()
    
    # First, try decoding without verification to get the kid
    try:
        unverified_headers = jwt.get_unverified_header(token)
        kid = unverified_headers.get("kid", "1")
    except JWTError:
        return None
    
    # Get the key for this kid
    signing_key = keys.get(kid)
    if not signing_key:
        return None
    
    # Verify with the appropriate key
    try:
        payload = jwt.decode(token, signing_key, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        # If the current key fails and there's a previous key, try it
        if kid != "0" and keys.get("0") != settings.jwt_secret:
            try:
                payload = jwt.decode(token, keys["0"], algorithms=[settings.jwt_algorithm])
                return payload
            except JWTError:
                return None
        return None


def generate_refresh_token_jti() -> str:
    """Generate a unique token identifier for refresh token revocation tracking."""
    return secrets.token_hex(16)