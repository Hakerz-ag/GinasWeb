"""Pydantic schemas for request/response validation — keeps the API contract clear and human-readable."""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr


# ── Auth ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str = ""
    password: str


class AuthResponse(BaseModel):
    user: "UserOut"
    token: str


# ── Users ────────────────────────────────────────────────────────────────────

class SubAccountOut(BaseModel):
    id: str
    name: str
    birth_date: str = ""
    phone: str = ""
    email: str = ""
    relationship: str = "child"
    skill_level: str = "none"       # "none", "beginner", "intermediate", "advanced"
    assessment_completed: bool = False
    sessions_taken: int = 0


class SubAccountCreate(BaseModel):
    name: str
    birth_date: str = ""
    phone: str = ""
    email: str = ""
    relationship: str = "child"    # "child", "spouse", "other"


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    phone: str = ""
    birth_date: str = ""
    skill_level: str = "none"      # "none", "beginner", "intermediate", "advanced"
    assessment_completed: bool = False
    sessions_taken: int = 0
    status: str = "active"
    created_at: Optional[datetime] = None
    sub_accounts: List[SubAccountOut] = []
    classes: List[str] = []      # class titles the user is enrolled in
    bookings: List[str] = []      # booking summaries


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str = ""
    birth_date: str = ""
    role: str = "customer"
    password: str = "changeme"


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    birth_date: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    skill_level: Optional[str] = None  # admin sets this after assessment
    assessment_completed: Optional[bool] = None
    sessions_taken: Optional[int] = None


# ── Classes ──────────────────────────────────────────────────────────────────

class ClassOut(BaseModel):
    id: str
    title: str
    instructor_name: str
    type: str
    level: str
    day_of_week: str
    start_time: str
    end_time: str
    start_date: str = ""   # "YYYY-MM-DD"
    end_date: str = ""     # "YYYY-MM-DD" — class auto-removes after this date
    max_students: int
    current_students: int
    price: float
    description: str = ""


class ClassCreate(BaseModel):
    title: str
    instructor_name: str
    type: str = "adult-clinic"
    level: str = "beginner"
    day_of_week: str = "Monday"
    start_time: str = "6:00 PM"
    end_time: str = "7:30 PM"
    start_date: str = ""    # "YYYY-MM-DD"
    end_date: str = ""      # "YYYY-MM-DD"
    max_students: int = 6
    price: float = 35
    description: str = ""


class ClassUpdate(BaseModel):
    title: Optional[str] = None
    instructor_name: Optional[str] = None
    type: Optional[str] = None
    level: Optional[str] = None
    day_of_week: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    max_students: Optional[int] = None
    price: Optional[float] = None
    description: Optional[str] = None


# ── Bookings ─────────────────────────────────────────────────────────────────

class BookingOut(BaseModel):
    id: str
    user_id: str
    court_number: int
    date: str
    start_time: str
    end_time: str
    status: str = "pending"
    contract_type: str = "open-single"
    ball_machine: bool = False
    party_size: int = 2
    notes: str = ""
    created_at: Optional[datetime] = None


class BookingCreate(BaseModel):
    user_id: str
    court_number: int = 1
    date: str
    start_time: str
    end_time: str
    contract_type: str = "open-single"
    ball_machine: bool = False
    party_size: int = 2
    notes: str = ""


class BookingUpdate(BaseModel):
    status: Optional[str] = None  # "approved", "denied", "completed"


# ── Enrollments ──────────────────────────────────────────────────────────────

class EnrollmentOut(BaseModel):
    id: str
    user_id: str
    class_id: str
    status: str = "active"
    enrolled_at: Optional[datetime] = None


class EnrollmentCreate(BaseModel):
    user_id: str
    class_id: str


# ── Open Times ───────────────────────────────────────────────────────────────

class OpenTimeOut(BaseModel):
    id: str
    day: str
    time: str
    court: str = "1"
    status: str = "available"


class OpenTimeCreate(BaseModel):
    day: str
    time: str
    court: str = "1"


# ── Email ────────────────────────────────────────────────────────────────────

class EmailRequest(BaseModel):
    days: List[str] = []       # ["Monday", "Wednesday"] — select multiple days
    times: List[str] = []      # ["6:00 PM", "7:00 PM"] — select multiple times
    subject: str
    body: str
    send_to_all: bool = False  # if True, ignore day/time filters


class EmailResponse(BaseModel):
    sent: bool
    recipient_count: int
    message: str


# ── Calendar ─────────────────────────────────────────────────────────────────

class CalendarDay(BaseModel):
    day: int
    date: str
    classes: List[ClassOut]
    bookings: List[BookingOut]


class CalendarMonth(BaseModel):
    year: int
    month: int
    days: List[CalendarDay]


# ── Generic ──────────────────────────────────────────────────────────────────

class MessageResponse(BaseModel):
    message: str


# ── Assessments (1-on-1 evaluation session) ──────────────────────────────────

class AssessmentOut(BaseModel):
    id: str
    user_id: str
    sub_account_id: Optional[str] = None
    date: str
    start_time: str
    end_time: str
    status: str = "pending"           # "pending", "completed", "cancelled"
    skill_level_assigned: str = "none" # level admin assigned after assessment
    notes: str = ""
    created_at: Optional[datetime] = None


class AssessmentCreate(BaseModel):
    user_id: str
    sub_account_id: Optional[str] = None
    date: str
    start_time: str
    end_time: str


class AssessmentUpdate(BaseModel):
    """Admin completes an assessment — sets skill level and marks completed."""
    status: Optional[str] = None
    skill_level_assigned: Optional[str] = None
    notes: Optional[str] = None


# ── Schedule Blocks (admin blocks times for lunch, closures, etc.) ──────────

class ScheduleBlockOut(BaseModel):
    id: str
    day: str
    start_time: str
    end_time: str
    reason: str = ""
    block_type: str = "closure"  # "closure", "delay", "lunch"


class ScheduleBlockCreate(BaseModel):
    day: str                    # "Monday", "Tuesday", etc. or "all"
    start_time: str             # "12:00 PM"
    end_time: str               # "1:00 PM"
    reason: str = ""            # "Lunch break", "Maintenance", "Closed"
    block_type: str = "closure" # "closure", "delay", "lunch"


# ── Chat Messages ────────────────────────────────────────────────────────────

class ChatMessageOut(BaseModel):
    id: str
    name: str
    email: str
    message: str
    read: bool = False
    created_at: Optional[datetime] = None


class ChatMessageCreate(BaseModel):
    name: str
    email: str
    message: str