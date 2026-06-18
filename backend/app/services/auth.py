"""Auth helpers — password hashing and JWT token creation/verification."""

from datetime import datetime, timedelta
from jose import jwt, JWTError
import bcrypt

from app.config import get_settings

settings = get_settings()


# ── Password hashing ────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    """Hash a plaintext password using bcrypt."""
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    """Check a plaintext password against a bcrypt hash."""
    return bcrypt.checkpw(plain.encode(), hashed.encode())


# ── JWT tokens ──────────────────────────────────────────────────────────────

def create_token(user_id: str, role: str) -> str:
    """Create a JWT token with user_id and role claims."""
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": user_id, "role": role, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> "dict | None":
    """Decode and verify a JWT token. Returns payload or None if invalid."""
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None