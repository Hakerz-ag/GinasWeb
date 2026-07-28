"""Encrypt existing birth_date values in users and sub_accounts tables.

OPERATIONS ORDER (required before running this migration in production):
  1. Set ENCRYPTION_KEY env var in Render dashboard (generate with:
     python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
  2. Run: alembic upgrade head
  3. Verify: spot-check a birth_date row starts with 'gAAAAA'

This migration re-encrypts any plaintext birth_date values using Fernet.
Already-encrypted values (detected by 'gAAAAA' prefix) are skipped — safe
to run multiple times. Downgrade decrypts back to plaintext.

In production, the migration RAISES if ENCRYPTION_KEY is not set (fail-fast
rather than silently leaving PII unencrypted and stamping as applied).

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
    """Return (Fernet, is_production). Raises in production when key missing."""
    from app.config import get_settings
    settings = get_settings()
    key = settings.encryption_key
    if not key:
        if settings.is_production:
            raise RuntimeError(
                "007_encrypt_birth_dates: ENCRYPTION_KEY is not set and environment=production. "
                "Set the key in Render dashboard before running migrations. "
                "Migration aborted — birth_date values NOT encrypted."
            )
        print("[007_encrypt_birth_dates] ENCRYPTION_KEY not set — skipping encryption (dev/staging mode).")
        return None
    from cryptography.fernet import Fernet
    return Fernet(key.encode() if isinstance(key, str) else key)


def _is_encrypted(value: str) -> bool:
    return value.startswith("gAAAAA")


def upgrade() -> None:
    f = _get_fernet()
    if f is None:
        return

    bind = op.get_bind()
    session = Session(bind=bind)

    total_encrypted = 0
    for table in ("users", "sub_accounts"):
        rows = session.execute(
            sa.text(f"SELECT id, birth_date FROM {table} WHERE birth_date IS NOT NULL AND birth_date != ''")
        ).fetchall()

        for row_id, birth_date in rows:
            if _is_encrypted(birth_date):
                continue
            encrypted = f.encrypt(birth_date.encode()).decode()
            session.execute(
                sa.text(f"UPDATE {table} SET birth_date = :enc WHERE id = :id"),
                {"enc": encrypted, "id": row_id},
            )
            total_encrypted += 1

    session.commit()
    print(f"[007_encrypt_birth_dates] Encrypted {total_encrypted} birth_date value(s).")


def downgrade() -> None:
    """Decrypt birth_date values back to plaintext."""
    f = _get_fernet()
    if f is None:
        return

    bind = op.get_bind()
    session = Session(bind=bind)

    total_decrypted = 0
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
                total_decrypted += 1
            except Exception as exc:
                print(f"[007_encrypt_birth_dates] Could not decrypt row {row_id} in {table}: {exc}")

    session.commit()
    print(f"[007_encrypt_birth_dates] Decrypted {total_decrypted} birth_date value(s).")
