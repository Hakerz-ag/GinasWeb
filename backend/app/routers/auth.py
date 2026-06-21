"""Auth router — login and register."""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import LoginRequest, RegisterRequest, AuthResponse, UserOut, SubAccountOut, MessageResponse
from app.services.auth import hash_password, verify_password, create_token

router = APIRouter()


def _user_to_out(user: User, db: Session) -> UserOut:
    """Convert a User model to a UserOut schema with classes and bookings."""
    from app.models import ClassEnrollment, ClassSession, CourtBooking

    enrollments = db.query(ClassEnrollment).filter(ClassEnrollment.user_id == user.id).all()
    class_titles = []
    for enr in enrollments:
        cls = db.query(ClassSession).filter(ClassSession.id == enr.class_id).first()
        if cls:
            class_titles.append(cls.title)

    user_bookings = db.query(CourtBooking).filter(CourtBooking.user_id == user.id).all()
    booking_summaries = [f"Court {b.court_number} — {b.date}" for b in user_bookings]

    return UserOut(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        phone=user.phone or "",
        birth_date=user.birth_date or "",
        skill_level=user.skill_level or "none",
        assessment_completed=user.assessment_completed or False,
        sessions_taken=user.sessions_taken or 0,
        status=user.status,
        created_at=user.created_at,
        sub_accounts=[SubAccountOut(
            id=s.id, name=s.name, birth_date=s.birth_date or "",
            phone=s.phone or "", email=s.email or "",
            relationship=s.relationship_type, skill_level=s.skill_level or "none",
            assessment_completed=s.assessment_completed or False,
            sessions_taken=s.sessions_taken or 0,
        ) for s in user.sub_accounts],
        classes=class_titles,
        bookings=booking_summaries,
    )


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate a user by email + password, return JWT token."""
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if user.status == "suspended":
        raise HTTPException(status_code=403, detail="Account suspended")

    token = create_token(user.id, user.role)
    return AuthResponse(user=_user_to_out(user, db), token=token)


@router.post("/register", response_model=MessageResponse)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new customer (pending admin approval)."""
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        name=body.name,
        phone=body.phone,
        role="customer",
        status="pending",
    )
    db.add(user)
    db.commit()
    return MessageResponse(message="Registration submitted. Pending admin approval.")