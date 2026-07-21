"""Add contract schedule tables

Revision ID: 005_contract_schedule
Revises: 004_refresh_tokens
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '005_contract_schedule'
down_revision = '004_refresh_tokens'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create contract_schedule_days table
    op.create_table(
        'contract_schedule_days',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('day', sa.String(), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('dates', sa.String(), server_default=''),
        sa.Column('off', sa.String(), server_default=''),
        sa.Column('classes', sa.Integer(), server_default='13'),
        sa.Column('sort_order', sa.Integer(), server_default='0'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # Create contract_schedule_slots table
    op.create_table(
        'contract_schedule_slots',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('day_id', sa.String(), sa.ForeignKey('contract_schedule_days.id', ondelete='CASCADE'), nullable=False),
        sa.Column('time', sa.String(), nullable=False),
        sa.Column('level', sa.String(), nullable=False),
        sa.Column('play', sa.String(), server_default='No'),
        sa.Column('ages', sa.String(), server_default=''),
        sa.Column('rate', sa.String(), nullable=False),
        sa.Column('sort_order', sa.Integer(), server_default='0'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('contract_schedule_slots')
    op.drop_table('contract_schedule_days')