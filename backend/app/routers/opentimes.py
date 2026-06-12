"""Open times router — manage available court time slots."""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import OpenTime
from app.schemas import OpenTimeOut, OpenTimeCreate, MessageResponse

router = APIRouter()


@router.get("", response_model=list[OpenTimeOut])
def list_open_times(db: Session = Depends(get_db)):
    """List all open time slots."""
    return db.query(OpenTime).all()


@router.post("", response_model=OpenTimeOut, status_code=201)
def add_open_time(body: OpenTimeCreate, db: Session = Depends(get_db)):
    """Add a new open time slot."""
    ot = OpenTime(day=body.day, time=body.time, court=body.court, status="available")
    db.add(ot)
    db.commit()
    db.refresh(ot)
    return ot


@router.put("/{ot_id}", response_model=OpenTimeOut)
def update_open_time(ot_id: str, status: str = None, db: Session = Depends(get_db)):
    """Update an open time slot (e.g., mark as booked)."""
    ot = db.query(OpenTime).filter(OpenTime.id == ot_id).first()
    if not ot:
        raise HTTPException(status_code=404, detail="Open time not found")
    if status:
        ot.status = status
    db.commit()
    db.refresh(ot)
    return ot


@router.delete("/{ot_id}", response_model=MessageResponse)
def delete_open_time(ot_id: str, db: Session = Depends(get_db)):
    """Delete an open time slot."""
    ot = db.query(OpenTime).filter(OpenTime.id == ot_id).first()
    if not ot:
        raise HTTPException(status_code=404, detail="Open time not found")
    db.delete(ot)
    db.commit()
    return MessageResponse(message="Open time deleted")