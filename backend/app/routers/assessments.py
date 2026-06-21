"""Assessment router — 1-on-1 evaluation sessions with Gina."""

import bleach
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import Assessment, User, SubAccount
from app.schemas import AssessmentOut, AssessmentCreate, AssessmentUpdate, MessageResponse

router = APIRouter()


def _sanitize(text: str) -> str:
    """Strip HTML tags and escape special characters to prevent XSS."""
    return bleach.clean(text, tags=[], strip=True)


@router.get("", response_model=List[AssessmentOut])
def list_assessments(user_id: str = None, status: str = None, db: Session = Depends(get_db)):
    """List assessments, optionally filter by user or status."""
    query = db.query(Assessment)
    if user_id:
        query = query.filter(Assessment.user_id == user_id)
    if status:
        query = query.filter(Assessment.status == status)
    return query.all()


@router.get("/{assessment_id}", response_model=AssessmentOut)
def get_assessment(assessment_id: str, db: Session = Depends(get_db)):
    """Get a single assessment."""
    asm = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not asm:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return asm


@router.post("", response_model=AssessmentOut, status_code=201)
def create_assessment(body: AssessmentCreate, db: Session = Depends(get_db)):
    """Book a 1-on-1 assessment session (customer or admin)."""
    # Verify user exists
    user = db.query(User).filter(User.id == body.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    assessment = Assessment(
        user_id=body.user_id,
        sub_account_id=body.sub_account_id,
        date=body.date,
        start_time=body.start_time,
        end_time=body.end_time,
        status="pending",
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment


@router.put("/{assessment_id}", response_model=AssessmentOut)
def update_assessment(assessment_id: str, body: AssessmentUpdate, db: Session = Depends(get_db)):
    """Admin completes an assessment — sets skill level and marks completed."""
    asm = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not asm:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Update assessment fields
    if body.status is not None:
        asm.status = body.status
    if body.skill_level_assigned is not None:
        asm.skill_level_assigned = body.skill_level_assigned
    if body.notes is not None:
        asm.notes = _sanitize(body.notes)

    # If completing the assessment, update the user's skill level and mark assessment done
    if body.status == "completed" and body.skill_level_assigned:
        if asm.sub_account_id:
            # Update sub-account skill level
            sub = db.query(SubAccount).filter(SubAccount.id == asm.sub_account_id).first()
            if sub:
                sub.skill_level = body.skill_level_assigned
                sub.assessment_completed = True
        else:
            # Update main user skill level
            user = db.query(User).filter(User.id == asm.user_id).first()
            if user:
                user.skill_level = body.skill_level_assigned
                user.assessment_completed = True

    db.commit()
    db.refresh(asm)
    return asm


@router.delete("/{assessment_id}", response_model=MessageResponse)
def delete_assessment(assessment_id: str, db: Session = Depends(get_db)):
    """Delete an assessment."""
    asm = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not asm:
        raise HTTPException(status_code=404, detail="Assessment not found")
    db.delete(asm)
    db.commit()
    return MessageResponse(message="Assessment deleted")


@router.put("/{assessment_id}/set-skill-level", response_model=MessageResponse)
def set_skill_level(
    assessment_id: str,
    skill_level: str,
    target: str = "user",  # "user" or "sub_account"
    db: Session = Depends(get_db),
):
    """Admin sets skill level for a user or sub-account after assessment.

    This is also used to promote/demote students from the admin portal.
    """
    if skill_level not in ("beginner", "intermediate", "advanced", "all"):
        raise HTTPException(status_code=400, detail="Invalid skill level. Must be beginner, intermediate, advanced, or all.")

    asm = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not asm:
        raise HTTPException(status_code=404, detail="Assessment not found")

    if target == "sub_account" and asm.sub_account_id:
        sub = db.query(SubAccount).filter(SubAccount.id == asm.sub_account_id).first()
        if sub:
            sub.skill_level = skill_level
            sub.assessment_completed = True
    else:
        user = db.query(User).filter(User.id == asm.user_id).first()
        if user:
            user.skill_level = skill_level
            user.assessment_completed = True

    db.commit()
    return MessageResponse(message=f"Skill level set to {skill_level}")