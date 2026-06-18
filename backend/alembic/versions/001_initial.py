"""Initial schema — all tables for Gina's Tennis World

Revision ID: 001_initial
Revises: 
Create Date: 2026-06-17
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Users ──────────────────────────────────────────────────────────────
    op.create_table(
        'users',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('email', sa.String(), unique=True, nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=False, server_default='customer'),
        sa.Column('phone', sa.String(), server_default=''),
        sa.Column('birth_date', sa.String(), server_default=''),
        sa.Column('skill_level', sa.String(), server_default='none'),
        sa.Column('assessment_completed', sa.Boolean(), server_default='false'),
        sa.Column('sessions_taken', sa.Integer(), server_default='0'),
        sa.Column('status', sa.String(), server_default='active'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_role', 'users', ['role'])

    # ── Sub Accounts ──────────────────────────────────────────────────────
    op.create_table(
        'sub_accounts',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('parent_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('birth_date', sa.String(), server_default=''),
        sa.Column('phone', sa.String(), server_default=''),
        sa.Column('email', sa.String(), server_default=''),
        sa.Column('relationship', sa.String(), server_default='child'),
        sa.Column('skill_level', sa.String(), server_default='none'),
        sa.Column('assessment_completed', sa.Boolean(), server_default='false'),
        sa.Column('sessions_taken', sa.Integer(), server_default='0'),
    )
    op.create_index('ix_sub_accounts_parent', 'sub_accounts', ['parent_id'])

    # ── Assessments ────────────────────────────────────────────────────────
    op.create_table(
        'assessments',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('sub_account_id', sa.String(), nullable=True),
        sa.Column('date', sa.String(), nullable=False),
        sa.Column('start_time', sa.String(), nullable=False),
        sa.Column('end_time', sa.String(), nullable=False),
        sa.Column('status', sa.String(), server_default='pending'),
        sa.Column('skill_level_assigned', sa.String(), server_default='none'),
        sa.Column('notes', sa.Text(), server_default=''),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_assessments_user', 'assessments', ['user_id'])

    # ── Class Sessions ────────────────────────────────────────────────────
    op.create_table(
        'class_sessions',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('instructor_name', sa.String(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('level', sa.String(), nullable=False),
        sa.Column('day_of_week', sa.String(), nullable=False),
        sa.Column('start_time', sa.String(), nullable=False),
        sa.Column('end_time', sa.String(), nullable=False),
        sa.Column('start_date', sa.String(), server_default=''),
        sa.Column('end_date', sa.String(), server_default=''),
        sa.Column('max_students', sa.Integer(), server_default='6'),
        sa.Column('current_students', sa.Integer(), server_default='0'),
        sa.Column('price', sa.Float(), server_default='0'),
        sa.Column('description', sa.Text(), server_default=''),
    )

    # ── Court Bookings ────────────────────────────────────────────────────
    op.create_table(
        'court_bookings',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('court_number', sa.Integer(), nullable=False),
        sa.Column('date', sa.String(), nullable=False),
        sa.Column('start_time', sa.String(), nullable=False),
        sa.Column('end_time', sa.String(), nullable=False),
        sa.Column('status', sa.String(), server_default='pending'),
        sa.Column('contract_type', sa.String(), server_default='open-single'),
        sa.Column('ball_machine', sa.Boolean(), server_default='false'),
        sa.Column('party_size', sa.Integer(), server_default='2'),
        sa.Column('notes', sa.Text(), server_default=''),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_bookings_user', 'court_bookings', ['user_id'])
    op.create_index('ix_bookings_date', 'court_bookings', ['date'])

    # ── Class Enrollments ──────────────────────────────────────────────────
    op.create_table(
        'class_enrollments',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('class_id', sa.String(), sa.ForeignKey('class_sessions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(), server_default='pending'),
        sa.Column('enrolled_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_enrollments_user', 'class_enrollments', ['user_id'])
    op.create_index('ix_enrollments_class', 'class_enrollments', ['class_id'])

    # ── Open Times ──────────────────────────────────────────────────────────
    op.create_table(
        'open_times',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('day', sa.String(), nullable=False),
        sa.Column('time', sa.String(), nullable=False),
        sa.Column('court', sa.String(), server_default='1'),
        sa.Column('status', sa.String(), server_default='available'),
    )

    # ── Schedule Blocks ────────────────────────────────────────────────────
    op.create_table(
        'schedule_blocks',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('day', sa.String(), nullable=False),
        sa.Column('start_time', sa.String(), nullable=False),
        sa.Column('end_time', sa.String(), nullable=False),
        sa.Column('reason', sa.String(), server_default=''),
        sa.Column('block_type', sa.String(), server_default='closure'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # ── Chat Messages ──────────────────────────────────────────────────────
    op.create_table(
        'chat_messages',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('read', sa.Boolean(), server_default='false'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # ── Notifications (NEW) ───────────────────────────────────────────────
    op.create_table(
        'notifications',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('type', sa.String(), nullable=False),  # booking, enrollment, assessment, payment, system
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('read', sa.Boolean(), server_default='false'),
        sa.Column('action_url', sa.String(), server_default=''),
        sa.Column('related_id', sa.String(), server_default=''),  # ID of related booking/class/etc
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_notifications_user', 'notifications', ['user_id'])
    op.create_index('ix_notifications_read', 'notifications', ['read'])

    # ── Payments (NEW) ─────────────────────────────────────────────────────
    op.create_table(
        'payments',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(), server_default='usd'),
        sa.Column('status', sa.String(), server_default='pending'),  # pending, completed, failed, refunded
        sa.Column('payment_type', sa.String(), nullable=False),  # class, booking, assessment
        sa.Column('payment_method', sa.String(), server_default='stripe'),  # stripe, cash, check, venmo, zelle, pay_at_location
        sa.Column('related_id', sa.String(), server_default=''),  # ID of related booking/class/assessment
        sa.Column('stripe_payment_intent_id', sa.String(), server_default=''),
        sa.Column('stripe_checkout_session_id', sa.String(), server_default=''),
        sa.Column('description', sa.String(), server_default=''),
        sa.Column('admin_notes', sa.Text(), server_default=''),  # Notes from Gina (e.g., "Received check #1234")
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_payments_user', 'payments', ['user_id'])
    op.create_index('ix_payments_status', 'payments', ['status'])

    # ── Password Reset Tokens (NEW) ───────────────────────────────────────
    op.create_table(
        'password_reset_tokens',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('token_hash', sa.String(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('used', sa.Boolean(), server_default='false'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_reset_tokens_user', 'password_reset_tokens', ['user_id'])


def downgrade() -> None:
    op.drop_table('password_reset_tokens')
    op.drop_table('payments')
    op.drop_table('notifications')
    op.drop_table('chat_messages')
    op.drop_table('schedule_blocks')
    op.drop_table('open_times')
    op.drop_table('class_enrollments')
    op.drop_table('court_bookings')
    op.drop_table('class_sessions')
    op.drop_table('assessments')
    op.drop_table('sub_accounts')
    op.drop_table('users')