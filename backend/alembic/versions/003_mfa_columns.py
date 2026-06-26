"""Add TOTP MFA columns to users table

Revision ID: 003_mfa_columns
Revises: 002_security_schema
Create Date: 2026-06-26
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '003_mfa_columns'
down_revision: Union[str, None] = '002_security_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Add TOTP MFA columns to users ──────────────────────────────────────
    op.add_column('users', sa.Column('totp_secret', sa.String(), nullable=True))
    op.add_column('users', sa.Column('totp_enabled', sa.Boolean(), nullable=True, server_default='0'))


def downgrade() -> None:
    op.drop_column('users', 'totp_enabled')
    op.drop_column('users', 'totp_secret')