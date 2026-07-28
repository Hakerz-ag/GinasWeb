"""Merge all divergent migration heads into a single chain.

Revision ID: 006_merge_heads
Revises: 003_payment_config, 005_contract_schedule, 005_spotlight_sort_order
Create Date: 2026-07-13
"""
from typing import Union
from alembic import op

revision: str = '006_merge_heads'
down_revision: Union[str, tuple] = (
    '003_payment_config',
    '005_contract_schedule',
    '005_spotlight_sort_order',
)
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
