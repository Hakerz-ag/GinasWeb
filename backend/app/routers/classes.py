"""Classes router — class session CRUD and enrollment."""

from datetime import date
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ClassSession, ClassEnrollment, User
from app.schemas import ClassOut, ClassCreate, ClassUpdate, EnrollmentOut, EnrollmentCreate, MessageResponse

router = APIRouter()


def _class_to_out(cls: ClassSession) -> ClassOut:
    """Convert a ClassSession model to ClassOut, checking if expired."""
    today_str = date.today().isoformat()
    return ClassOut(
        id=cls.id,
        title=cls.title,
        instructor_name=cls.instructor_name,
        type=cls.type,
        level=cls.level,
        day_of_week=cls.day_of_week,
        start_time=cls.start_time,
        end_time=cls.end_time,
        start_date=cls.start_date or "",
        end_date=cls.end_date or "",
        max_students=cls.max_students,
        current_students=cls.current_students,
        price=cls.price,
        description=cls.description or "",
    )


def _is_expired(cls: ClassSession) -> bool:
    """Check if a class has passed its end_date."""
    if not cls.end_date:
        return False
    try:
        return date.today() > date.fromisoformat(cls.end_date)
    except ValueError:
        return False


@router.get("", response_model=list[ClassOut])
def list_classes(level: str = None, type: str = None, db: Session = Depends(get_db)):
    """List all active classes (expired ones are filtered out), optionally filter by level or type."""
    query = db.query(ClassSession)
    if level:
        query = query.filter(ClassSession.level == level)
    if type:
        query = query.filter(ClassSession.type == type)
    all_classes = query.all()
    # Filter out expired classes
    active = [c for c in all_classes if not _is_expired(c)]
    return [_class_to_out(c) for c in active]


@router.get("/{class_id}", response_model=ClassOut)
def get_class(class_id: str, db: Session = Depends(get_db)):
    """Get a single class."""
    cls = db.query(ClassSession).filter(ClassSession.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    return cls


@router.post("", response_model=ClassOut, status_code=201)
def create_class(body: ClassCreate, db: Session = Depends(get_db)):
    """Add a new class (admin)."""
    cls = ClassSession(
        title=body.title,
        instructor_name=body.instructor_name,
        type=body.type,
        level=body.level,
        day_of_week=body.day_of_week,
        start_time=body.start_time,
        end_time=body.end_time,
        max_students=body.max_students,
        price=body.price,
        description=body.description,
    )
    db.add(cls)
    db.commit()
    db.refresh(cls)
    return cls


@router.put("/{class_id}", response_model=ClassOut)
def update_class(class_id: str, body: ClassUpdate, db: Session = Depends(get_db)):
    """Update a class."""
    cls = db.query(ClassSession).filter(ClassSession.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(cls, field, value)

    db.commit()
    db.refresh(cls)
    return cls


@router.delete("/{class_id}", response_model=MessageResponse)
def delete_class(class_id: str, db: Session = Depends(get_db)):
    """Delete a class."""
    cls = db.query(ClassSession).filter(ClassSession.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    db.delete(cls)
    db.commit()
    return MessageResponse(message="Class deleted")


# ── Enrollments ─────────────────────────────────────────────────────────────

@router.post("/enroll", response_model=EnrollmentOut, status_code=201)
def enroll_in_class(body: EnrollmentCreate, db: Session = Depends(get_db)):
    """Enroll a user in a class. User must have completed assessment first."""
    # Check user has completed assessment
    user = db.query(User).filter(User.id == body.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.assessment_completed:
        raise HTTPException(
            status_code=403,
            detail="You must complete a 1-on-1 assessment with Gina before enrolling in classes. Please book an assessment first."
        )

    # Check class exists and has room
    cls = db.query(ClassSession).filter(ClassSession.id == body.class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    # Check user's skill level matches the class level
    if cls.level != "all" and user.skill_level != "none" and user.skill_level != cls.level:
        raise HTTPException(
            status_code=403,
            detail=f"This class is for {cls.level} level players. Your current level is {user.skill_level}."
        )

    # Check not already enrolled
    existing = db.query(ClassEnrollment).filter(
        ClassEnrollment.user_id == body.user_id,
        ClassEnrollment.class_id == body.class_id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Already enrolled")

    # Check capacity
    if cls.current_students >= cls.max_students:
        status = "waitlisted"
    else:
        status = "active"
        cls.current_students += 1

    enrollment = ClassEnrollment(user_id=body.user_id, class_id=body.class_id, status=status)
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.delete("/enroll/{enrollment_id}", response_model=MessageResponse)
def unenroll(enrollment_id: str, db: Session = Depends(get_db)):
    """Remove a user from a class."""
    enr = db.query(ClassEnrollment).filter(ClassEnrollment.id == enrollment_id).first()
    if not enr:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    # Decrement student count if was active
    if enr.status == "active":
        cls = db.query(ClassSession).filter(ClassSession.id == enr.class_id).first()
        if cls and cls.current_students > 0:
            cls.current_students -= 1

    db.delete(enr)
    db.commit()
    return MessageResponse(message="Unenrolled from class")