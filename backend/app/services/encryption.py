"""Fernet-based encryption for PII fields (birth_date).

Usage in models:
    from app.services.encryption import EncryptedString
    birth_date = Column(EncryptedString, default="")

Requires ENCRYPTION_KEY env var in production. Falls back to plaintext
in development (no key set), so local dev works without configuration.
"""

import logging
from sqlalchemy import String, TypeDecorator

logger = logging.getLogger(__name__)

_fernet = None
_key_missing_warned = False


def _get_fernet():
    global _fernet, _key_missing_warned
    if _fernet is not None:
        return _fernet
    try:
        from app.config import get_settings
        key = get_settings().encryption_key
        if not key:
            if not _key_missing_warned:
                logger.warning("ENCRYPTION_KEY not set — birth_date stored as plaintext. Set in production.")
                _key_missing_warned = True
            return None
        from cryptography.fernet import Fernet
        _fernet = Fernet(key.encode() if isinstance(key, str) else key)
        return _fernet
    except Exception as exc:
        logger.error("Failed to initialise Fernet: %s", exc)
        return None


def encrypt(value: str) -> str:
    """Encrypt a string. Returns plaintext if no key configured."""
    if not value:
        return value
    f = _get_fernet()
    if f is None:
        return value
    return f.encrypt(value.encode()).decode()


def decrypt(value: str) -> str:
    """Decrypt a string. Returns value as-is if decryption fails (plaintext fallback)."""
    if not value:
        return value
    f = _get_fernet()
    if f is None:
        return value
    try:
        return f.decrypt(value.encode()).decode()
    except Exception:
        # Value is plaintext (pre-encryption data) — return as-is
        return value


class EncryptedString(TypeDecorator):
    """SQLAlchemy column type that transparently encrypts/decrypts string values."""

    impl = String
    cache_ok = True

    def process_bind_param(self, value, dialect):
        """Encrypt before writing to DB."""
        if value is None:
            return value
        return encrypt(str(value))

    def process_result_value(self, value, dialect):
        """Decrypt after reading from DB."""
        if value is None:
            return value
        return decrypt(str(value))
