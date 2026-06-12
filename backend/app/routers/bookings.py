"""Bookings router — court booking CRUD."""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CourtBooking
from app.schemas import BookingOut, BookingCreate, BookingUpdate, MessageResponse

router = APIRouter()


@router.get("", response_model=list[BookingOut])
def list_bookings(status: str = None, user_id: str = None, db: Session = Depends(get_db)):
    """List bookings, optionally filter by status or user."""
    query = db.query(CourtBooking)
    if status:
        query = query.filter(CourtBooking.status == status)
    if user_id:
        query = query.filter(CourtBooking.user_id == user_id)
    return query.all()


@router.get("/{booking_id}", response_model=BookingOut)
def get_booking(booking_id: str, db: Session = Depends(get_db)):
    """Get a single booking."""
    booking = db.query(CourtBooking).filter(CourtBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.post("", response_model=BookingOut, status_code=201)
def create_booking(body: BookingCreate, db: Session = Depends(get_db)):
    """Create a new court booking."""
    booking = CourtBooking(
        user_id=body.user_id,
        court_number=body.court_number,
        date=body.date,
        start_time=body.start_time,
        end_time=body.end_time,
        contract_type=body.contract_type,
        ball_machine=body.ball_machine,
        party_size=body.party_size,
        notes=body.notes,
        status="pending",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@router.put("/{booking_id}", response_model=BookingOut)
def update_booking(booking_id: str, body: BookingUpdate, db: Session = Depends(get_db)):
    """Update a booking (e.g., approve/deny)."""
    booking = db.query(CourtBooking).filter(CourtBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if body.status is not None:
        booking.status = body.status

    db.commit()
    db.refresh(booking)
    return booking


@router.delete("/{booking_id}", response_model=MessageResponse)
def delete_booking(booking_id: str, db: Session = Depends(get_db)):
    """Delete a booking."""
    booking = db.query(CourtBooking).filter(CourtBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    db.delete(booking)
    db.commit()
    return MessageResponse(message="Booking deleted")