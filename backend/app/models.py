"""SQLAlchemy ORM models for Gina's Tennis World."""

from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, Enum as SAEnum,
)
from sqlalchemy.orm import relationship
from app.database import Base


# ── Users ──────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: f"u-{datetime.now().timestamp()}")
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
    created_at = Column(DateTime, default=datetime.utcnow)

    sub_accounts = relationship("SubAccount", back_populates="parent", cascade="all, delete-orphan")
    bookings = relationship("CourtBooking", back_populates="user", cascade="all, delete-orphan")
    enrollments = relationship("ClassEnrollment", back_populates="user", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="user", cascade="all, delete-orphan")


class SubAccount(Base):
    __tablename__ = "sub_accounts"

    id = Column(String, primary_key=True, default=lambda: f"sub-{datetime.now().timestamp()}")
    parent_id = Column(String, ForeignKey("users.id"), nullable=False)
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

    id = Column(String, primary_key=True, default=lambda: f"asm-{datetime.now().timestamp()}")
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    sub_account_id = Column(String, nullable=True)  # optional: if assessing a sub-account
    date = Column(String, nullable=False)  # "YYYY-MM-DD"
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    status = Column(String, default="pending")  # "pending", "completed", "cancelled"
    skill_level_assigned = Column(String, default="none")  # what level admin assigned
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="assessments")


# ── Classes ─────────────────────────────────────────────────────────────────

class ClassSession(Base):
    __tablename__ = "class_sessions"

    id = Column(String, primary_key=True, default=lambda: f"cls-{datetime.now().timestamp()}")
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

    id = Column(String, primary_key=True, default=lambda: f"bk-{datetime.now().timestamp()}")
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    court_number = Column(Integer, nullable=False)
    date = Column(String, nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    status = Column(String, default="pending")  # "pending", "approved", "denied", "completed"
    contract_type = Column(String, default="open-single")  # "30-week", "15-week", "open-single"
    ball_machine = Column(Boolean, default=False)
    party_size = Column(Integer, default=2)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="bookings")


# ── Enrollments ────────────────────────────────────────────────────────────

class ClassEnrollment(Base):
    __tablename__ = "class_enrollments"

    id = Column(String, primary_key=True, default=lambda: f"enr-{datetime.now().timestamp()}")
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    class_id = Column(String, ForeignKey("class_sessions.id"), nullable=False)
    status = Column(String, default="active")  # "pending", "approved", "waitlisted", "active"
    enrolled_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="enrollments")
    class_session = relationship("ClassSession", back_populates="enrollments")


# ── Open Times ──────────────────────────────────────────────────────────────

class OpenTime(Base):
    __tablename__ = "open_times"

    id = Column(String, primary_key=True, default=lambda: f"ot-{datetime.now().timestamp()}")
    day = Column(String, nullable=False)
    time = Column(String, nullable=False)
    court = Column(String, nullable=False, default="1")
    status = Column(String, default="available")  # "available", "booked"


# ── Schedule Blocks (admin blocks times for lunch, closures, etc.) ────────

class ScheduleBlock(Base):
    __tablename__ = "schedule_blocks"

    id = Column(String, primary_key=True, default=lambda: f"blk-{datetime.now().timestamp()}")
    day = Column(String, nullable=False)          # "Monday", "Tuesday", etc. or "all"
    start_time = Column(String, nullable=False)   # "12:00 PM"
    end_time = Column(String, nullable=False)     # "1:00 PM"
    reason = Column(String, default="")            # "Lunch break", "Maintenance", "Closed"
    block_type = Column(String, default="closure") # "closure", "delay", "lunch"
    created_at = Column(DateTime, default=datetime.utcnow)


# ── Chat Messages (from floating chat widget) ─────────────────────────────

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=lambda: f"chat-{datetime.now().timestamp()}")
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)