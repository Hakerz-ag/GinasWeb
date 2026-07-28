"""Encrypt existing birth_date values in users and sub_accounts tables.

This migration re-encrypts any plaintext birth_date values using the
ENCRYPTION_KEY env var. If ENCRYPTION_KEY is not set, values are left
as-is (the EncryptedString TypeDecorator will warn and use plaintext).

Revision ID: 007_encrypt_birth_dates
Revises: 006_merge_heads
Create Date: 2026-07-13
"""
from typing import Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.orm import Session

revision: str = '007_encrypt_birth_dates'
down_revision: Union[str, None] = '006_merge_heads'
branch_labels = None
depends_on = None


def _get_fernet():
    """Return a Fernet instance if ENCRYPTION_KEY is set, else None."""
    import os
    key = os.environ.get("ENCRYPTION_KEY", "")
    if not key:
        return None
    try:
        from cryptography.fernet import Fernet
        return Fernet(key.encode())
    except Exception as exc:
        print(f"[007_encrypt_birth_dates] Could not initialise Fernet: {exc}")
        return None


def _is_encrypted(value: str) -> bool:
    """Fernet tokens start with 'gAAAAA' (base64 of 0x80 prefix)."""
    return value.startswith("gAAAAA")


def upgrade() -> None:
    f = _get_fernet()
    if f is None:
        print("[007_encrypt_birth_dates] ENCRYPTION_KEY not set — skipping birth_date encryption.")
        return

    bind = op.get_bind()
    session = Session(bind=bind)

    for table in ("users", "sub_accounts"):
        rows = session.execute(
            sa.text(f"SELECT id, birth_date FROM {table} WHERE birth_date IS NOT NULL AND birth_date != ''")
        ).fetchall()

        for row_id, birth_date in rows:
            if _is_encrypted(birth_date):
                continue  # already encrypted
            encrypted = f.encrypt(birth_date.encode()).decode()
            session.execute(
                sa.text(f"UPDATE {table} SET birth_date = :enc WHERE id = :id"),
                {"enc": encrypted, "id": row_id},
            )

    session.commit()
    print(f"[007_encrypt_birth_dates] birth_date encryption complete.")


def downgrade() -> None:
    """Decrypt birth_date values back to plaintext."""
    f = _get_fernet()
    if f is None:
        print("[007_encrypt_birth_dates] ENCRYPTION_KEY not set — cannot decrypt.")
        return

    bind = op.get_bind()
    session = Session(bind=bind)

    for table in ("users", "sub_accounts"):
        rows = session.execute(
            sa.text(f"SELECT id, birth_date FROM {table} WHERE birth_date IS NOT NULL AND birth_date != ''")
        ).fetchall()

        for row_id, birth_date in rows:
            if not _is_encrypted(birth_date):
                continue
            try:
                decrypted = f.decrypt(birth_date.encode()).decode()
                session.execute(
                    sa.text(f"UPDATE {table} SET birth_date = :dec WHERE id = :id"),
                    {"dec": decrypted, "id": row_id},
                )
            except Exception:
                pass

    session.commit()
