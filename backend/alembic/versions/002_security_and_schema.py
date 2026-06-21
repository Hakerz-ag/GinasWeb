"""Security and schema improvements — indexes, soft-delete, audit columns, chat user_id

Revision ID: 002_security_schema
Revises: 001_initial
Create Date: 2026-06-21
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002_security_schema'
down_revision: Union[str, None] = '001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. Foreign key indexes (prevent table scans on JOINs) ────────────────
    op.create_index('ix_bookings_user_id', 'court_bookings', ['user_id'])
    op.create_index('ix_payments_user_id', 'payments', ['user_id'])
    op.create_index('ix_enrollments_user_id', 'class_enrollments', ['user_id'])
    op.create_index('ix_enrollments_class_id', 'class_enrollments', ['class_id'])
    op.create_index('ix_assessments_user_id', 'assessments', ['user_id'])
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])
    op.create_index('ix_sub_accounts_parent_id', 'sub_accounts', ['parent_id'])

    # ── 2. Commonly queried fields ──────────────────────────────────────────
    op.create_index('ix_bookings_date', 'court_bookings', ['date'])
    op.create_index('ix_bookings_status', 'court_bookings', ['status'])
    op.create_index('ix_payments_status', 'payments', ['status'])
    op.create_index('ix_enrollments_status', 'class_enrollments', ['status'])

    # ── 3. Add user_id to chat_messages (nullable for guest messages) ────────
    op.add_column('chat_messages', sa.Column('user_id', sa.String(), nullable=True))
    op.create_foreign_key('fk_chat_messages_user_id', 'chat_messages', 'users', ['user_id'], ['id'], ondelete='SET NULL')
    op.create_index('ix_chat_messages_user_id', 'chat_messages', ['user_id'])

    # ── 4. Add booking_id and enrollment_id to payments (explicit FKs) ──────
    op.add_column('payments', sa.Column('booking_id', sa.String(), nullable=True))
    op.add_column('payments', sa.Column('enrollment_id', sa.String(), nullable=True))
    op.create_foreign_key('fk_payments_booking_id', 'payments', 'court_bookings', ['booking_id'], ['id'], ondelete='SET NULL')
    op.create_foreign_key('fk_payments_enrollment_id', 'payments', 'class_enrollments', ['enrollment_id'], ['id'], ondelete='SET NULL')

    # ── 5. Add confirmed_by and confirmed_at to payments (audit trail) ──────
    op.add_column('payments', sa.Column('confirmed_by', sa.String(), nullable=True))
    op.add_column('payments', sa.Column('confirmed_at', sa.DateTime(), nullable=True))

    # ── 6. Soft-delete columns (deleted_at) ─────────────────────────────────
    op.add_column('court_bookings', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    op.add_column('payments', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    op.add_column('class_enrollments', sa.Column('deleted_at', sa.DateTime(), nullable=True))

    # ── 7. Add date column to schedule_blocks ────────────────────────────────
    op.add_column('schedule_blocks', sa.Column('date', sa.String(), nullable=True))

    # ── 8. Add reply_to column to chat_messages ──────────────────────────────
    op.add_column('chat_messages', sa.Column('reply_to', sa.String(), nullable=True))


def downgrade() -> None:
    # ── Reverse all changes ──────────────────────────────────────────────────
    op.drop_column('chat_messages', 'reply_to')
    op.drop_column('schedule_blocks', 'date')
    op.drop_column('class_enrollments', 'deleted_at')
    op.drop_column('payments', 'deleted_at')
    op.drop_column('court_bookings', 'deleted_at')
    op.drop_column('payments', 'confirmed_at')
    op.drop_column('payments', 'confirmed_by')
    op.drop_constraint('fk_payments_enrollment_id', 'payments', type_='foreignkey')
    op.drop_constraint('fk_payments_booking_id', 'payments', type_='foreignkey')
    op.drop_column('payments', 'enrollment_id')
    op.drop_column('payments', 'booking_id')
    op.drop_constraint('fk_chat_messages_user_id', 'chat_messages', type_='foreignkey')
    op.drop_index('ix_chat_messages_user_id', 'chat_messages')
    op.drop_column('chat_messages', 'user_id')

    op.drop_index('ix_enrollments_status', 'class_enrollments')
    op.drop_index('ix_payments_status', 'payments')
    op.drop_index('ix_bookings_status', 'court_bookings')
    op.drop_index('ix_bookings_date', 'court_bookings')
    op.drop_index('ix_sub_accounts_parent_id', 'sub_accounts')
    op.drop_index('ix_notifications_user_id', 'notifications')
    op.drop_index('ix_assessments_user_id', 'assessments')
    op.drop_index('ix_enrollments_class_id', 'class_enrollments')
    op.drop_index('ix_enrollments_user_id', 'class_enrollments')
    op.drop_index('ix_payments_user_id', 'payments')
    op.drop_index('ix_bookings_user_id', 'court_bookings')