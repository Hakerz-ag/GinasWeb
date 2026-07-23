"""SQLAlchemy ORM models for Gina's Tennis World."""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, Enum as SAEnum,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


def _generate_id(prefix: str) -> str:
    """Generate a unique ID with a human-readable prefix."""
    return f"{prefix}-{uuid.uuid4().hex[:12]}"


# ── Users ──────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: _generate_id("u"))
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False, default="customer")  # "admin" or "customer"
    phone = Column(String, default="")
    birth_date = Column(String, default="")  # "YYYY-MM-DD"
    skill_level = Column(String, default="none")  # "none", "beginner", "intermediate", "advanced"
    assessment_completed = Column(Boolean, default=False)  # must complete 1-on-1 before classes
    sessions_taken = Column(Integer, default=0)  # total sessions completed
    status = Column(String, default="active")  # "active", "pending", "suspended"
    totp_secret = Column(String, nullable=True)  # Base32-encoded TOTP secret for MFA
    totp_enabled = Column(Boolean, default=False)  # Whether MFA is enabled for this user
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    sub_accounts = relationship("SubAccount", back_populates="parent", cascade="all, delete-orphan")
    bookings = relationship("CourtBooking", back_populates="user", cascade="all, delete-orphan")
    enrollments = relationship("ClassEnrollment", back_populates="user", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="user", cascade="all, delete-orphan")


class SubAccount(Base):
    __tablename__ = "sub_accounts"

    id = Column(String, primary_key=True, default=lambda: _generate_id("sub"))
    parent_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    birth_date = Column(String, default="")  # "YYYY-MM-DD"
    phone = Column(String, default="")
    email = Column(String, default="")
    relationship_type = Column("relationship", String, default="child")  # "child", "spouse", "other"
    skill_level = Column(String, default="none")  # "none", "beginner", "intermediate", "advanced"
    assessment_completed = Column(Boolean, default=False)
    sessions_taken = Column(Integer, default=0)

    parent = relationship("User", back_populates="sub_accounts")


# ── Assessments (1-on-1 evaluation session) ────────────────────────────────

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(String, primary_key=True, default=lambda: _generate_id("asm"))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sub_account_id = Column(String, nullable=True)  # optional: if assessing a sub-account
    date = Column(String, nullable=False)  # "YYYY-MM-DD"
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    status = Column(String, default="pending")  # "pending", "completed", "cancelled"
    skill_level_assigned = Column(String, default="none")  # what level admin assigned
    notes = Column(Text, default="")
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="assessments")


# ── Classes ─────────────────────────────────────────────────────────────────

class ClassSession(Base):
    __tablename__ = "class_sessions"

    id = Column(String, primary_key=True, default=lambda: _generate_id("cls"))
    title = Column(String, nullable=False)
    instructor_name = Column(String, nullable=True)  # kept for backward compat, no longer required
    type = Column(String, nullable=False)  # "junior-clinic", "adult-clinic", "private", "semi-private", "assessment"
    level = Column(String, nullable=False)  # "beginner", "adv-beg", "intermediate", "int-adv", "advanced"
    season = Column(String, default="")  # "Fall 2026", "Spring 2026", "Winter 2026" — which season this class belongs to
    day_of_week = Column(String, nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    start_date = Column(String, default="")  # "YYYY-MM-DD" — when the class season begins
    end_date = Column(String, default="")   # "YYYY-MM-DD" — when the class season ends (auto-remove after)
    max_students = Column(Integer, default=6)  # kept for backward compat, no longer enforced
    min_age = Column(Integer, default=0)  # minimum age for the class
    max_age = Column(Integer, default=100)  # maximum age for the class
    current_students = Column(Integer, default=0)
    price = Column(Float, default=0)
    description = Column(Text, default="")

    enrollments = relationship("ClassEnrollment", back_populates="class_session", cascade="all, delete-orphan")


# ── Bookings ────────────────────────────────────────────────────────────────

class CourtBooking(Base):
    __tablename__ = "court_bookings"

    id = Column(String, primary_key=True, default=lambda: _generate_id("bk"))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    court_number = Column(Integer, nullable=False)
    date = Column(String, nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    status = Column(String, default="pending")  # "pending", "approved", "denied", "completed"
    contract_type = Column(String, default="open-single")  # "30-week", "15-week", "open-single"
    ball_machine = Column(Boolean, default=False)
    party_size = Column(Integer, default=2)
    notes = Column(Text, default="")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime, nullable=True)  # soft-delete

    user = relationship("User", back_populates="bookings")


# ── Enrollments ────────────────────────────────────────────────────────────

class ClassEnrollment(Base):
    __tablename__ = "class_enrollments"

    id = Column(String, primary_key=True, default=lambda: _generate_id("enr"))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(String, ForeignKey("class_sessions.id", ondelete="CASCADE"), nullable=False)
    sub_account_id = Column(String, ForeignKey("sub_accounts.id", ondelete="SET NULL"), nullable=True)  # Which child is enrolled (null = parent themselves)
    status = Column(String, default="pending")  # "pending", "approved", "waitlisted", "active"
    enrolled_at = Column(DateTime, server_default=func.now())
    deleted_at = Column(DateTime, nullable=True)  # soft-delete

    user = relationship("User", back_populates="enrollments")
    class_session = relationship("ClassSession", back_populates="enrollments")
    sub_account = relationship("SubAccount")


# ── Open Times ──────────────────────────────────────────────────────────────

class OpenTime(Base):
    __tablename__ = "open_times"

    id = Column(String, primary_key=True, default=lambda: _generate_id("ot"))
    day = Column(String, nullable=False)
    start_time = Column(String, nullable=False, default="9:00 AM")  # e.g. "9:00 AM"
    end_time = Column(String, nullable=False, default="10:00 AM")    # e.g. "10:00 AM"
    time = Column(String, nullable=True)  # Legacy field — kept for backward compatibility
    court = Column(String, nullable=False, default="1")
    status = Column(String, default="available")  # "available", "booked"


# ── Schedule Blocks (admin blocks times for lunch, closures, etc.) ────────

class ScheduleBlock(Base):
    __tablename__ = "schedule_blocks"

    id = Column(String, primary_key=True, default=lambda: _generate_id("blk"))
    day = Column(String, nullable=False)          # "Monday", "Tuesday", etc. or "all"
    start_time = Column(String, nullable=False)   # "12:00 PM"
    end_time = Column(String, nullable=False)     # "1:00 PM"
    reason = Column(String, default="")            # "Lunch break", "Maintenance", "Closed"
    block_type = Column(String, default="closure") # "closure", "delay", "lunch"
    date = Column(String, nullable=True)           # Optional specific date "YYYY-MM-DD"
    created_at = Column(DateTime, server_default=func.now())


# ── Chat Messages (from floating chat widget) ─────────────────────────────

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=lambda: _generate_id("chat"))
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  # nullable for guest messages
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    read = Column(Boolean, default=False)
    reply_to = Column(String, nullable=True)  # ID of message being replied to (admin replies)
    created_at = Column(DateTime, server_default=func.now())


# ── Notifications (real-time alerts for both admin and customers) ──────────

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=lambda: _generate_id("notif"))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String, nullable=False)  # "booking", "enrollment", "assessment", "payment", "system"
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    read = Column(Boolean, default=False)
    action_url = Column(String, default="")  # e.g. "/admin/bookings/bk-123"
    related_id = Column(String, default="")  # ID of related booking/class/etc
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="notifications")


# ── Payments (tracks all payment methods: Stripe, cash, check, Venmo, Zelle, etc.) ─

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True, default=lambda: _generate_id("pay"))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="usd")
    status = Column(String, default="pending")  # "pending", "completed", "failed", "refunded"
    payment_type = Column(String, nullable=False)  # "class", "booking", "assessment"
    payment_method = Column(String, default="stripe")  # "stripe", "cash", "check", "venmo", "zelle", "pay_at_location"
    related_id = Column(String, default="")  # ID of related booking/class/assessment (legacy)
    booking_id = Column(String, ForeignKey("court_bookings.id", ondelete="SET NULL"), nullable=True)  # explicit FK
    enrollment_id = Column(String, ForeignKey("class_enrollments.id", ondelete="SET NULL"), nullable=True)  # explicit FK
    stripe_payment_intent_id = Column(String, default="")
    stripe_checkout_session_id = Column(String, default="")
    description = Column(String, default="")
    admin_notes = Column(Text, default="")  # Notes from Gina (e.g., "Received check #1234")
    confirmed_by = Column(String, nullable=True)  # admin user_id who confirmed offline payment
    confirmed_at = Column(DateTime, nullable=True)  # when the payment was confirmed
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime, nullable=True)  # soft-delete

    user = relationship("User", back_populates="payments")


# ── Payment Plans (installment scheduling) ─────────────────────────────────
class PaymentPlan(Base):
    __tablename__ = "payment_plans"

    id = Column(String, primary_key=True, default=lambda: _generate_id("pp"))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    total_amount = Column(Float, nullable=False)
    plan_type = Column(String, nullable=False)  # 'two', 'monthly', etc.
    related_booking_id = Column(String, ForeignKey("court_bookings.id", ondelete="SET NULL"), nullable=True)
    related_enrollment_id = Column(String, ForeignKey("class_enrollments.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    installments = relationship("PaymentPlanInstallment", back_populates="plan", cascade="all, delete-orphan")


class PaymentPlanInstallment(Base):
    __tablename__ = "payment_plan_installments"

    id = Column(String, primary_key=True, default=lambda: _generate_id("pinst"))
    plan_id = Column(String, ForeignKey("payment_plans.id", ondelete="CASCADE"), nullable=False)
    due_date = Column(String, nullable=True)  # optional due date YYYY-MM-DD
    amount = Column(Float, nullable=False)
    status = Column(String, default="scheduled")  # 'scheduled', 'pending', 'completed', 'failed'
    payment_id = Column(String, ForeignKey("payments.id", ondelete="SET NULL"), nullable=True)

    plan = relationship("PaymentPlan", back_populates="installments")


# ── Password Reset Tokens ─────────────────────────────────────────────────

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(String, primary_key=True, default=lambda: _generate_id("reset"))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


# ── Refresh Tokens (for JWT refresh token rotation) ────────────────────────

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(String, primary_key=True, default=lambda: _generate_id("rt"))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_jti = Column(String, unique=True, nullable=False)  # JWT jti claim for revocation
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False)  # Soft-revoke instead of hard delete
    created_at = Column(DateTime, server_default=func.now())


# ── Payment Method Config (admin toggles which methods are enabled) ──────────

class PaymentMethodConfig(Base):
    """Single-row table storing which payment methods Gina accepts."""
    __tablename__ = "payment_method_config"

    id = Column(String, primary_key=True, default="pmc-singleton")  # always one row
    stripe_enabled = Column(Boolean, default=True)
    cash_enabled = Column(Boolean, default=True)
    check_enabled = Column(Boolean, default=True)
    venmo_enabled = Column(Boolean, default=True)
    zelle_enabled = Column(Boolean, default=True)
    pay_at_location_enabled = Column(Boolean, default=True)
    venmo_handle = Column(String, default="")   # e.g. "@Gina-Tennis"
    zelle_info = Column(String, default="")      # e.g. "ginas@tennis.com"
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


# ── Seasons (persist current season settings) ───────────────────────────────

class Season(Base):
    __tablename__ = "seasons"

    id = Column(String, primary_key=True, default=lambda: _generate_id("season"))
    name = Column(String, nullable=False)  # Winter, Spring, Summer, Fall
    continue_next = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


# ── Spotlight / Student of the Month ───────────────────────────────────────
class Spotlight(Base):
    __tablename__ = "spotlight"

    id = Column(String, primary_key=True, default=lambda: _generate_id("spot"))
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, default="")
    description = Column(Text, default="")
    image_path = Column(String, default="")  # path under /uploads/spotlight/
    is_adult = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)  # lower = shown first
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User")


# ── Contract Schedule (admin-managed class time slots) ──────────────────────

class ContractScheduleSlot(Base):
    """Individual time slot within a contract schedule day."""
    __tablename__ = "contract_schedule_slots"

    id = Column(String, primary_key=True, default=lambda: _generate_id("cslot"))
    day_id = Column(String, ForeignKey("contract_schedule_days.id", ondelete="CASCADE"), nullable=False)
    time = Column(String, nullable=False)          # "9:00 – 10:00 AM"
    level = Column(String, nullable=False)          # "Beg./Adv.Beg.", "Intermediate", etc.
    play = Column(String, default="No")             # "No", "1/2 hr" — for adult programs
    ages = Column(String, default="")               # "7–12", "11–16" — for junior programs
    rate = Column(String, nullable=False)            # "$570", "$660", etc.
    sort_order = Column(Integer, default=0)          # display order within the day
    created_at = Column(DateTime, server_default=func.now())

    day = relationship("ContractScheduleDay", back_populates="slots")


class ContractScheduleDay(Base):
    """A day of contract schedule (e.g. Monday Adult, Tuesday Junior)."""
    __tablename__ = "contract_schedule_days"

    id = Column(String, primary_key=True, default=lambda: _generate_id("cday"))
    day = Column(String, nullable=False)             # "Monday", "Tuesday", etc.
    category = Column(String, nullable=False)         # "Adult" or "Junior"
    dates = Column(String, default="")               # "Sept 14 – Dec 21"
    off = Column(String, default="")                  # "Sept 21 & Nov 23"
    classes = Column(Integer, default=13)             # number of classes in the session
    sort_order = Column(Integer, default=0)          # display order
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    slots = relationship("ContractScheduleSlot", back_populates="day", cascade="all, delete-orphan",
                          order_by="ContractScheduleSlot.sort_order")