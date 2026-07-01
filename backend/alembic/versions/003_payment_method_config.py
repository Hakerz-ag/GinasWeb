"""Add payment_method_config table for admin-toggled payment methods

Revision ID: 003_payment_config
Revises: 002_security_schema
Create Date: 2026-06-28
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '003_payment_config'
down_revision: Union[str, None] = '002_security_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'payment_method_config',
        sa.Column('id', sa.String(), primary_key=True, server_default='pmc-singleton'),
        sa.Column('stripe_enabled', sa.Boolean(), server_default='1', nullable=False),
        sa.Column('cash_enabled', sa.Boolean(), server_default='1', nullable=False),
        sa.Column('check_enabled', sa.Boolean(), server_default='1', nullable=False),
        sa.Column('venmo_enabled', sa.Boolean(), server_default='1', nullable=False),
        sa.Column('zelle_enabled', sa.Boolean(), server_default='1', nullable=False),
        sa.Column('pay_at_location_enabled', sa.Boolean(), server_default='1', nullable=False),
        sa.Column('venmo_handle', sa.String(), server_default='', nullable=False),
        sa.Column('zelle_info', sa.String(), server_default='', nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Seed with default row so the admin can toggle immediately
    op.execute(
        "INSERT INTO payment_method_config (id, stripe_enabled, cash_enabled, check_enabled, venmo_enabled, zelle_enabled, pay_at_location_enabled, venmo_handle, zelle_info) "
        "VALUES ('pmc-singleton', 1, 1, 1, 1, 1, 1, '', '')"
    )


def downgrade() -> None:
    op.drop_table('payment_method_config')