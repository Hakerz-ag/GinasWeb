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
    refresh_token: str = ""  # Long-lived refresh token for token rotation
    mfa_required: bool = False
    mfa_temp_token: str = ""  # Temporary token valid only for MFA verification


class MFASetupResponse(BaseModel):
    """Response when setting up MFA — includes the TOTP URI and QR code as a data URL."""
    secret: str
    uri: str
    qr_code_data_url: str  # base64-encoded PNG QR code image


class MFAVerifyRequest(BaseModel):
    """Request to verify a TOTP code during login or MFA setup."""
    code: str
    temp_token: str = ""  # Required for login MFA verification


class MFAVerifyResponse(BaseModel):
    """Response after successful MFA verification — returns the real auth token."""
    user: "UserOut"
    token: str


class RefreshRequest(BaseModel):
    """Request to exchange a refresh token for a new access token."""
    refresh_token: str


class RefreshResponse(BaseModel):
    """Response with new access + refresh token pair."""
    user: "UserOut"
    access_token: str
    refresh_token: str


class PasswordResetRequest(BaseModel):
    """Request to initiate a password reset."""
    email: str


class PasswordResetConfirmRequest(BaseModel):
    """Request to confirm a password reset with the token and new password."""
    email: str
    token: str
    new_password: str


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
    totp_enabled: bool = False     # Whether MFA is enabled for this user
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
    season: str = ""   # "Fall 2026", "Spring 2026", "Winter 2026"
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
    season: str = ""    # "Fall 2026", "Spring 2026", "Winter 2026"
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
    season: Optional[str] = None
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
    sub_account_id: Optional[str] = None  # Which child is enrolled (null = parent themselves)
    status: str = "active"
    enrolled_at: Optional[datetime] = None


class EnrollmentCreate(BaseModel):
    user_id: str
    class_id: str
    sub_account_id: Optional[str] = None  # If enrolling a child, pass the sub_account_id


class BulkEnrollmentCreate(BaseModel):
    """Enroll multiple sub-accounts (kids) in a class at once."""
    user_id: str
    class_id: str
    sub_account_ids: List[str] = []  # IDs of kids to enroll. If empty, enrolls the parent.


# ── Open Times ───────────────────────────────────────────────────────────────

class OpenTimeOut(BaseModel):
    id: str
    day: str
    start_time: str  # e.g. "09:00"
    end_time: str    # e.g. "11:00"
    court: str = "1"
    status: str = "available"


class OpenTimeCreate(BaseModel):
    day: str
    start_time: str  # e.g. "09:00"
    end_time: str    # e.g. "11:00"
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
    date: Optional[str] = None


class ScheduleBlockCreate(BaseModel):
    day: str                    # "Monday", "Tuesday", etc. or "all"
    start_time: str             # "12:00 PM"
    end_time: str               # "1:00 PM"
    reason: str = ""            # "Lunch break", "Maintenance", "Closed"
    block_type: str = "closure" # "closure", "delay", "lunch"


# ── Seasons (persist admin-selected season)
class SeasonOut(BaseModel):
    id: str
    name: str
    continue_next: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class SeasonCreate(BaseModel):
    name: str
    continue_next: bool = False


# ── Chat Messages ────────────────────────────────────────────────────────────

class ChatMessageOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    name: str
    email: str
    message: str
    read: bool = False
    reply_to: Optional[str] = None
    created_at: Optional[datetime] = None


class ChatMessageCreate(BaseModel):
    user_id: Optional[str] = None  # populated from auth token when available
    name: str
    email: str
    message: str


# ── Notifications ────────────────────────────────────────────────────────────

class NotificationOut(BaseModel):
    id: str
    user_id: str
    type: str          # "booking", "enrollment", "assessment", "payment", "system"
    title: str
    message: str
    read: bool = False
    action_url: str = ""
    related_id: str = ""
    created_at: Optional[datetime] = None


class NotificationCreate(BaseModel):
    user_id: str
    type: str
    title: str
    message: str
    action_url: str = ""
    related_id: str = ""


class NotificationUpdate(BaseModel):
    read: Optional[bool] = None


# ── Payments ─────────────────────────────────────────────────────────────────

# ── Payment Methods ─────────────────────────────────────────────────────────
# These are the supported payment methods. Gina can accept any combination.
PAYMENT_METHOD_STRIPE = "stripe"
PAYMENT_METHOD_CASH = "cash"
PAYMENT_METHOD_CHECK = "check"
PAYMENT_METHOD_VENMO = "venmo"
PAYMENT_METHOD_ZELLE = "zelle"
PAYMENT_METHOD_PAY_AT_LOCATION = "pay_at_location"

ALL_PAYMENT_METHODS = [
    PAYMENT_METHOD_STRIPE,
    PAYMENT_METHOD_CASH,
    PAYMENT_METHOD_CHECK,
    PAYMENT_METHOD_VENMO,
    PAYMENT_METHOD_ZELLE,
    PAYMENT_METHOD_PAY_AT_LOCATION,
]

# Human-readable labels for the frontend
PAYMENT_METHOD_LABELS = {
    PAYMENT_METHOD_STRIPE: "Credit/Debit Card (Stripe)",
    PAYMENT_METHOD_CASH: "Cash",
    PAYMENT_METHOD_CHECK: "Check",
    PAYMENT_METHOD_VENMO: "Venmo",
    PAYMENT_METHOD_ZELLE: "Zelle",
    PAYMENT_METHOD_PAY_AT_LOCATION: "Pay at Location",
}


class PaymentOut(BaseModel):
    id: str
    user_id: str
    amount: float
    currency: str = "usd"
    status: str = "pending"       # "pending", "completed", "failed", "refunded"
    payment_type: str             # "class", "booking", "assessment"
    payment_method: str = "stripe"  # "stripe", "cash", "check", "venmo", "zelle", "pay_at_location"
    related_id: str = ""
    booking_id: Optional[str] = None
    enrollment_id: Optional[str] = None
    stripe_payment_intent_id: str = ""
    stripe_checkout_session_id: str = ""
    description: str = ""
    admin_notes: str = ""
    confirmed_by: Optional[str] = None
    confirmed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class PaymentCreate(BaseModel):
    user_id: str
    amount: float
    payment_type: str   # "class", "booking", "assessment"
    payment_method: str = PAYMENT_METHOD_STRIPE  # defaults to stripe, can be any method
    related_id: str = ""
    booking_id: Optional[str] = None
    enrollment_id: Optional[str] = None
    description: str = ""


class PaymentUpdate(BaseModel):
    status: Optional[str] = None
    payment_method: Optional[str] = None
    stripe_payment_intent_id: Optional[str] = None


# ── Payment Plans ─────────────────────────────────────────────────────────
class PaymentPlanCreate(BaseModel):
    user_id: str
    total_amount: float
    plan_type: str  # 'two' or 'monthly'
    booking_id: Optional[str] = None
    enrollment_id: Optional[str] = None


class InstallmentOut(BaseModel):
    id: str
    due_date: Optional[str] = None
    amount: float
    status: str
    payment_id: Optional[str] = None


class PaymentPlanOut(BaseModel):
    id: str
    user_id: str
    total_amount: float
    plan_type: str
    installments: List[InstallmentOut] = []
    created_at: Optional[datetime] = None
    stripe_checkout_session_id: Optional[str] = None
    admin_notes: Optional[str] = None
    confirmed_by: Optional[str] = None  # admin user_id who confirmed the payment


class PaymentMethodConfig(BaseModel):
    """Configuration for which payment methods Gina accepts."""
    enabled_methods: list[str] = [PAYMENT_METHOD_STRIPE]
    stripe_enabled: bool = True
    cash_enabled: bool = True
    check_enabled: bool = True
    venmo_enabled: bool = True
    zelle_enabled: bool = True
    pay_at_location_enabled: bool = True
    venmo_handle: str = ""   # e.g. "@Gina-Tennis"
    zelle_info: str = ""     # e.g. "ginas@tennis.com"


# ── Password Reset ───────────────────────────────────────────────────────────

class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


# ── Dashboard Stats (for admin dashboard) ────────────────────────────────────

class DashboardStats(BaseModel):
    total_customers: int
    active_customers: int
    pending_customers: int
    total_bookings: int
    pending_bookings: int
    total_enrollments: int
    active_classes: int
    total_revenue: float
    unread_messages: int
    recent_signups: int