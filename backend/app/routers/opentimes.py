"""Open times router — manage available court time slots."""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import OpenTime
from app.schemas import OpenTimeOut, OpenTimeCreate, MessageResponse

router = APIRouter()


def _opentime_to_out(ot: OpenTime) -> OpenTimeOut:
    """Convert an OpenTime model to OpenTimeOut schema."""
    return OpenTimeOut(
        id=ot.id,
        day=ot.day,
        start_time=ot.start_time or "",
        end_time=ot.end_time or "",
        court=ot.court or "1",
        status=ot.status or "available",
    )


@router.get("", response_model=list[OpenTimeOut])
def list_open_times(db: Session = Depends(get_db)):
    """List all open time slots."""
    return [_opentime_to_out(ot) for ot in db.query(OpenTime).all()]


@router.post("", response_model=OpenTimeOut, status_code=201)
def add_open_time(body: OpenTimeCreate, db: Session = Depends(get_db)):
    """Add a new open time slot."""
    ot = OpenTime(
        day=body.day,
        start_time=body.start_time,
        end_time=body.end_time,
        court=body.court,
        status="available",
    )
    db.add(ot)
    db.commit()
    db.refresh(ot)
    return _opentime_to_out(ot)


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
    return _opentime_to_out(ot)


@router.delete("/{ot_id}", response_model=MessageResponse)
def delete_open_time(ot_id: str, db: Session = Depends(get_db)):
    """Delete an open time slot."""
    ot = db.query(OpenTime).filter(OpenTime.id == ot_id).first()
    if not ot:
        raise HTTPException(status_code=404, detail="Open time not found")
    db.delete(ot)
    db.commit()
    return MessageResponse(message="Open time deleted")