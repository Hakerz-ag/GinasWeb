"""Schedule blocks router — admin can block times for lunch, closures, delayed openings."""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ScheduleBlock
from app.schemas import ScheduleBlockOut, ScheduleBlockCreate, MessageResponse

router = APIRouter()


@router.get("", response_model=list[ScheduleBlockOut])
def list_blocks(db: Session = Depends(get_db)):
    """List all schedule blocks."""
    blocks = db.query(ScheduleBlock).all()
    return [
        ScheduleBlockOut(
            id=b.id,
            day=b.day,
            start_time=b.start_time,
            end_time=b.end_time,
            reason=b.reason or "",
            block_type=b.block_type or "closure",
        )
        for b in blocks
    ]


@router.post("", response_model=ScheduleBlockOut, status_code=201)
def create_block(body: ScheduleBlockCreate, db: Session = Depends(get_db)):
    """Add a new schedule block (e.g., lunch break, closure, delayed opening)."""
    block = ScheduleBlock(
        day=body.day,
        start_time=body.start_time,
        end_time=body.end_time,
        reason=body.reason,
        block_type=body.block_type,
    )
    db.add(block)
    db.commit()
    db.refresh(block)
    return ScheduleBlockOut(
        id=block.id,
        day=block.day,
        start_time=block.start_time,
        end_time=block.end_time,
        reason=block.reason or "",
        block_type=block.block_type or "closure",
    )


@router.delete("/{block_id}", response_model=MessageResponse)
def delete_block(block_id: str, db: Session = Depends(get_db)):
    """Remove a schedule block."""
    block = db.query(ScheduleBlock).filter(ScheduleBlock.id == block_id).first()
    if not block:
        raise HTTPException(status_code=404, detail="Schedule block not found")
    db.delete(block)
    db.commit()
    return MessageResponse(message="Schedule block removed")