"""Fernet-based encryption for PII fields (birth_date).

Usage in models:
    from app.services.encryption import EncryptedString
    birth_date = Column(EncryptedString, default="")

Requires ENCRYPTION_KEY env var in production. In development (no key set)
values are stored as plaintext so local dev works without configuration.
Set ENCRYPTION_KEY with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
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
        settings = get_settings()
        key = settings.encryption_key
        if not key:
            if not _key_missing_warned:
                if settings.is_production:
                    logger.critical(
                        "ENCRYPTION_KEY not set in production — birth_date stored as plaintext. Set immediately."
                    )
                else:
                    logger.warning("ENCRYPTION_KEY not set — birth_date stored as plaintext (dev mode).")
                _key_missing_warned = True
            return None
        from cryptography.fernet import Fernet
        _fernet = Fernet(key.encode() if isinstance(key, str) else key)
        return _fernet
    except Exception as exc:
        logger.error("Failed to initialise Fernet: %s", exc)
        return None


def is_encrypted(value: str) -> bool:
    """Fernet tokens start with 'gAAAAA' (base64 of 0x80 version prefix)."""
    return value.startswith("gAAAAA")


def encrypt(value: str) -> str:
    """Encrypt a string. Returns plaintext only when no key configured (dev mode)."""
    if not value:
        return value
    f = _get_fernet()
    if f is None:
        return value
    return f.encrypt(value.encode()).decode()


def decrypt(value: str) -> str:
    """Decrypt a string. Returns value as-is for legacy plaintext.
    Logs a warning when a value looks encrypted but fails — indicates a wrong key.
    """
    if not value:
        return value
    f = _get_fernet()
    if f is None:
        return value
    try:
        return f.decrypt(value.encode()).decode()
    except Exception:
        if is_encrypted(value):
            # Value looks like a Fernet token but decryption failed — almost always a wrong/rotated key
            logger.warning(
                "Decryption failed for a value that appears encrypted (starts with gAAAAA). "
                "Check that ENCRYPTION_KEY matches the key used to encrypt this data. "
                "Returning raw ciphertext — user will see garbled output."
            )
        # Legacy plaintext value — return as-is
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
