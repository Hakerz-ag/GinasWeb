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
    instructor_name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # "junior-clinic", "adult-clinic", "private", "semi-private", "assessment"
    level = Column(String, nullable=False)  # "beginner", "intermediate", "advanced", "all"
    day_of_week = Column(String, nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    start_date = Column(String, default="")  # "YYYY-MM-DD" — when the class season begins
    end_date = Column(String, default="")   # "YYYY-MM-DD" — when the class season ends (auto-remove after)
    max_students = Column(Integer, default=6)
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

    user = relationship("User", back_populates="bookings")


# ── Enrollments ────────────────────────────────────────────────────────────

class ClassEnrollment(Base):
    __tablename__ = "class_enrollments"

    id = Column(String, primary_key=True, default=lambda: _generate_id("enr"))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(String, ForeignKey("class_sessions.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="pending")  # "pending", "approved", "waitlisted", "active"
    enrolled_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="enrollments")
    class_session = relationship("ClassSession", back_populates="enrollments")


# ── Open Times ──────────────────────────────────────────────────────────────

class OpenTime(Base):
    __tablename__ = "open_times"

    id = Column(String, primary_key=True, default=lambda: _generate_id("ot"))
    day = Column(String, nullable=False)
    time = Column(String, nullable=False)
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
    created_at = Column(DateTime, server_default=func.now())


# ── Chat Messages (from floating chat widget) ─────────────────────────────

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=lambda: _generate_id("chat"))
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    read = Column(Boolean, default=False)
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
    related_id = Column(String, default="")  # ID of related booking/class/assessment
    stripe_payment_intent_id = Column(String, default="")
    stripe_checkout_session_id = Column(String, default="")
    description = Column(String, default="")
    admin_notes = Column(Text, default="")  # Notes from Gina (e.g., "Received check #1234")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="payments")


# ── Password Reset Tokens ─────────────────────────────────────────────────

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(String, primary_key=True, default=lambda: _generate_id("reset"))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())