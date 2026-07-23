"""Add sort_order column to spotlight table

Revision ID: 005_spotlight_sort_order
Revises: 004_refresh_tokens
Create Date: 2026-07-23
"""

from alembic import op
import sqlalchemy as sa

revision = '005_spotlight_sort_order'
down_revision = '004_refresh_tokens'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('spotlight', sa.Column('sort_order', sa.Integer(), server_default='0', nullable=True))


def downgrade():
    op.drop_column('spotlight', 'sort_order')