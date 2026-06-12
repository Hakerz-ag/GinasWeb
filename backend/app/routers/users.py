"""Users router — CRUD for user management (admin)."""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, SubAccount
from app.schemas import UserOut, UserCreate, UserUpdate, SubAccountCreate, SubAccountOut, MessageResponse
from app.routers.auth import _user_to_out

router = APIRouter()


@router.get("", response_model=list[UserOut])
def list_users(role: str = None, db: Session = Depends(get_db)):
    """List all users, optionally filter by role."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    users = query.all()
    return [_user_to_out(u, db) for u in users]


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: str, db: Session = Depends(get_db)):
    """Get a single user by ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_to_out(user, db)


@router.post("", response_model=UserOut)
def create_user(body: UserCreate, db: Session = Depends(get_db)):
    """Add a new user (admin action)."""
    from app.services.auth import hash_password
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already exists")

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        name=body.name,
        phone=body.phone,
        role=body.role,
        status="active",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _user_to_out(user, db)


@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: str, body: UserUpdate, db: Session = Depends(get_db)):
    """Update a user's info."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.name is not None:
        user.name = body.name
    if body.email is not None:
        user.email = body.email
    if body.phone is not None:
        user.phone = body.phone
    if body.role is not None:
        user.role = body.role
    if body.status is not None:
        user.status = body.status
    if body.skill_level is not None:
        user.skill_level = body.skill_level
    if body.assessment_completed is not None:
        user.assessment_completed = body.assessment_completed
    if body.birth_date is not None:
        user.birth_date = body.birth_date
    if body.sessions_taken is not None:
        user.sessions_taken = body.sessions_taken

    db.commit()
    db.refresh(user)
    return _user_to_out(user, db)


@router.delete("/{user_id}", response_model=MessageResponse)
def delete_user(user_id: str, db: Session = Depends(get_db)):
    """Delete a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return MessageResponse(message="User deleted")


# ── Sub-accounts (family members) ───────────────────────────────────────────

@router.post("/{user_id}/sub-accounts", response_model=SubAccountOut)
def add_sub_account(user_id: str, body: SubAccountCreate, db: Session = Depends(get_db)):
    """Add a family sub-account to a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    sub = SubAccount(
        parent_id=user_id,
        name=body.name,
        birth_date=body.birth_date,
        phone=body.phone,
        email=body.email,
        relationship_type=body.relationship,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return SubAccountOut(
        id=sub.id, name=sub.name, birth_date=sub.birth_date or "",
        phone=sub.phone or "", email=sub.email or "",
        relationship=sub.relationship_type, skill_level=sub.skill_level or "none",
        assessment_completed=sub.assessment_completed or False,
        sessions_taken=sub.sessions_taken or 0,
    )


@router.delete("/{user_id}/sub-accounts/{sub_id}", response_model=MessageResponse)
def remove_sub_account(user_id: str, sub_id: str, db: Session = Depends(get_db)):
    """Remove a family sub-account."""
    sub = db.query(SubAccount).filter(SubAccount.id == sub_id, SubAccount.parent_id == user_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Sub-account not found")
    db.delete(sub)
    db.commit()
    return MessageResponse(message="Sub-account removed")


@router.put("/{user_id}/sub-accounts/{sub_id}", response_model=SubAccountOut)
def update_sub_account(user_id: str, sub_id: str, body: dict, db: Session = Depends(get_db)):
    """Update a family sub-account (e.g., set skill level)."""
    sub = db.query(SubAccount).filter(SubAccount.id == sub_id, SubAccount.parent_id == user_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Sub-account not found")

    if "name" in body:
        sub.name = body["name"]
    if "birth_date" in body:
        sub.birth_date = body["birth_date"]
    if "phone" in body:
        sub.phone = body["phone"]
    if "email" in body:
        sub.email = body["email"]
    if "relationship" in body:
        sub.relationship_type = body["relationship"]
    if "skill_level" in body:
        sub.skill_level = body["skill_level"]
    if "assessment_completed" in body:
        sub.assessment_completed = body["assessment_completed"]

    db.commit()
    db.refresh(sub)
    return SubAccountOut(
        id=sub.id, name=sub.name, birth_date=sub.birth_date or "",
        phone=sub.phone or "", email=sub.email or "",
        relationship=sub.relationship_type, skill_level=sub.skill_level or "none",
        assessment_completed=sub.assessment_completed or False,
        sessions_taken=sub.sessions_taken or 0,
    )