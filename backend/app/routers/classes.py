"""Classes router — class session CRUD and enrollment."""

from datetime import date, timedelta
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ClassSession, ClassEnrollment, SubAccount, User
from app.schemas import (
    ClassOut, ClassCreate, ClassUpdate,
    EnrollmentOut, EnrollmentCreate, BulkEnrollmentCreate,
    MessageResponse,
)

router = APIRouter()

# Season ordering for continuation
SEASON_ORDER = {"winter": 0, "spring": 1, "summer": 2, "fall": 3}
NEXT_SEASON = {"winter": "spring", "spring": "summer", "summer": "fall", "fall": "winter"}


def _class_to_out(cls: ClassSession) -> ClassOut:
    """Convert a ClassSession model to ClassOut, checking if expired."""
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
        season=cls.season or "",
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
def list_classes(level: str = None, type: str = None, season: str = None, db: Session = Depends(get_db)):
    """List all active classes (expired ones are filtered out), optionally filter by level, type, or season."""
    query = db.query(ClassSession)
    if level:
        query = query.filter(ClassSession.level == level)
    if type:
        query = query.filter(ClassSession.type == type)
    if season:
        query = query.filter(ClassSession.season == season)
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
    return _class_to_out(cls)


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
        season=body.season,
        start_date=body.start_date,
        end_date=body.end_date,
    )
    db.add(cls)
    db.commit()
    db.refresh(cls)
    return _class_to_out(cls)


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
    return _class_to_out(cls)


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

def _enrollment_to_out(enr: ClassEnrollment) -> EnrollmentOut:
    """Convert a ClassEnrollment model to EnrollmentOut."""
    return EnrollmentOut(
        id=enr.id,
        user_id=enr.user_id,
        class_id=enr.class_id,
        sub_account_id=enr.sub_account_id,
        status=enr.status,
        enrolled_at=enr.enrolled_at,
    )


@router.post("/enroll", response_model=EnrollmentOut, status_code=201)
def enroll_in_class(body: EnrollmentCreate, db: Session = Depends(get_db)):
    """Enroll a user (or their child) in a class.

    - If sub_account_id is provided, enrolls that child (sub-account).
    - If sub_account_id is null, enrolls the parent themselves.
    - For junior classes (type='junior'), sub_account_id is required.
    - Checks skill level of the enrollee against the class level.
    """
    # Resolve who is actually being enrolled
    enrollee_skill = None
    enrollee_name = "User"

    user = db.query(User).filter(User.id == body.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.sub_account_id:
        # Enrolling a child
        sub = db.query(SubAccount).filter(SubAccount.id == body.sub_account_id).first()
        if not sub:
            raise HTTPException(status_code=404, detail="Child not found")
        if sub.parent_id != body.user_id:
            raise HTTPException(status_code=403, detail="That child does not belong to you")
        enrollee_skill = sub.skill_level
        enrollee_name = sub.name
    else:
        # Enrolling the parent themselves
        if not user.assessment_completed:
            raise HTTPException(
                status_code=403,
                detail="You must complete a 1-on-1 assessment with Gina before enrolling in classes. Please book an assessment first."
            )
        enrollee_skill = user.skill_level
        enrollee_name = user.name

    # Check class exists
    cls = db.query(ClassSession).filter(ClassSession.id == body.class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    # Junior classes require a sub_account_id
    if cls.type == "junior" and not body.sub_account_id:
        raise HTTPException(
            status_code=400,
            detail="Junior classes require selecting which child is enrolling."
        )

    # Check skill level matches
    if cls.level != "all" and enrollee_skill and enrollee_skill != "none" and enrollee_skill != cls.level:
        raise HTTPException(
            status_code=403,
            detail=f"This class is for {cls.level} level players. {enrollee_name}'s current level is {enrollee_skill}."
        )

    # Check not already enrolled (same person, same class)
    existing = db.query(ClassEnrollment).filter(
        ClassEnrollment.user_id == body.user_id,
        ClassEnrollment.class_id == body.class_id,
        ClassEnrollment.sub_account_id == body.sub_account_id,  # handles None correctly
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"{enrollee_name} is already enrolled in this class")

    # Check capacity
    if cls.current_students >= cls.max_students:
        status = "waitlisted"
    else:
        status = "active"
        cls.current_students += 1

    enrollment = ClassEnrollment(
        user_id=body.user_id,
        class_id=body.class_id,
        sub_account_id=body.sub_account_id,
        status=status,
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return _enrollment_to_out(enrollment)


@router.post("/enroll/bulk", response_model=list[EnrollmentOut], status_code=201)
def bulk_enroll(body: BulkEnrollmentCreate, db: Session = Depends(get_db)):
    """Enroll multiple children in a class at once. Parent can also enroll themselves."""
    user = db.query(User).filter(User.id == body.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    cls = db.query(ClassSession).filter(ClassSession.id == body.class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    results = []
    sub_account_ids = body.sub_account_ids or []

    # If no sub_accounts and not a junior class, enroll the parent
    if not sub_account_ids and cls.type != "junior":
        if not user.assessment_completed:
            raise HTTPException(status_code=403, detail="Assessment required before enrolling")
        existing = db.query(ClassEnrollment).filter(
            ClassEnrollment.user_id == body.user_id,
            ClassEnrollment.class_id == body.class_id,
            ClassEnrollment.sub_account_id.is_(None),
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="You are already enrolled in this class")

        if cls.current_students >= cls.max_students:
            status = "waitlisted"
        else:
            status = "active"
            cls.current_students += 1

        enrollment = ClassEnrollment(user_id=body.user_id, class_id=body.class_id, status=status)
        db.add(enrollment)
        db.commit()
        db.refresh(enrollment)
        return [_enrollment_to_out(enrollment)]

    # Enroll each child
    for sa_id in sub_account_ids:
        sub = db.query(SubAccount).filter(SubAccount.id == sa_id).first()
        if not sub:
            raise HTTPException(status_code=404, detail=f"Child {sa_id} not found")
        if sub.parent_id != body.user_id:
            raise HTTPException(status_code=403, detail=f"Child {sub.name} does not belong to you")

        # Check skill level
        if cls.level != "all" and sub.skill_level and sub.skill_level != "none" and sub.skill_level != cls.level:
            raise HTTPException(
                status_code=403,
                detail=f"This class is for {cls.level} level players. {sub.name}'s level is {sub.skill_level}."
            )

        # Check not already enrolled
        existing = db.query(ClassEnrollment).filter(
            ClassEnrollment.user_id == body.user_id,
            ClassEnrollment.class_id == body.class_id,
            ClassEnrollment.sub_account_id == sa_id,
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail=f"{sub.name} is already enrolled in this class")

        # Check capacity
        if cls.current_students >= cls.max_students:
            status = "waitlisted"
        else:
            status = "active"
            cls.current_students += 1

        enrollment = ClassEnrollment(
            user_id=body.user_id,
            class_id=body.class_id,
            sub_account_id=sa_id,
            status=status,
        )
        db.add(enrollment)
        results.append(enrollment)

    db.commit()
    for e in results:
        db.refresh(e)
    return [_enrollment_to_out(e) for e in results]


@router.post("/renew/{class_id}", response_model=ClassOut, status_code=201)
def renew_class_to_next_season(class_id: str, db: Session = Depends(get_db)):
    """Clone a class into the next season (e.g. Fall → Winter).

    - Shifts start_date and end_date by the appropriate number of weeks.
    - Copies all active enrollments to the new class.
    - Returns the newly created class.
    """
    cls = db.query(ClassSession).filter(ClassSession.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    current_season = cls.season or "spring"
    next_season = NEXT_SEASON.get(current_season, "spring")

    # Calculate date shift: roughly 13 weeks (one season)
    try:
        old_start = date.fromisoformat(cls.start_date) if cls.start_date else date.today()
        old_end = date.fromisoformat(cls.end_date) if cls.end_date else old_start + timedelta(weeks=12)
    except (ValueError, TypeError):
        old_start = date.today()
        old_end = old_start + timedelta(weeks=12)

    new_start = old_start + timedelta(weeks=13)
    new_end = old_end + timedelta(weeks=13)

    # Create the new class
    new_cls = ClassSession(
        title=cls.title,
        instructor_name=cls.instructor_name,
        type=cls.type,
        level=cls.level,
        day_of_week=cls.day_of_week,
        start_time=cls.start_time,
        end_time=cls.end_time,
        max_students=cls.max_students,
        price=cls.price,
        description=cls.description,
        season=next_season,
        start_date=new_start.isoformat(),
        end_date=new_end.isoformat(),
        current_students=0,
    )
    db.add(new_cls)
    db.flush()  # get the ID

    # Copy active enrollments
    enrollments = db.query(ClassEnrollment).filter(
        ClassEnrollment.class_id == class_id,
        ClassEnrollment.status == "active",
    ).all()

    for enr in enrollments:
        new_enr = ClassEnrollment(
            user_id=enr.user_id,
            class_id=new_cls.id,
            sub_account_id=enr.sub_account_id,
            status="active",
        )
        db.add(new_enr)
        new_cls.current_students += 1

    db.commit()
    db.refresh(new_cls)
    return _class_to_out(new_cls)


@router.get("/enrollments", response_model=list[EnrollmentOut])
def list_enrollments(user_id: str = None, class_id: str = None, db: Session = Depends(get_db)):
    """List enrollments, optionally filtered by user or class."""
    query = db.query(ClassEnrollment)
    if user_id:
        query = query.filter(ClassEnrollment.user_id == user_id)
    if class_id:
        query = query.filter(ClassEnrollment.class_id == class_id)
    return [_enrollment_to_out(e) for e in query.all()]


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