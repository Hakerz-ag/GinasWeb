"""Bookings router — court booking CRUD."""

from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CourtBooking, Payment, Notification
from app.schemas import BookingOut, BookingCreate, BookingUpdate, MessageResponse
from app.services.auth_middleware import get_current_user, require_admin
from app.models import User

router = APIRouter()


@router.get("", response_model=list[BookingOut])
def list_bookings(status: str = None, user_id: str = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List bookings, optionally filter by status or user."""
    query = db.query(CourtBooking)
    # Non-admin users can only see their own bookings
    if current_user.role != 'admin':
        query = query.filter(CourtBooking.user_id == current_user.id)
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
    # If this is a contract booking (e.g., 30-week / 15-week), apply refund policy:
    # - If the booking is cancelled at least 12 hours before the booking start, issue a 50% refund of completed payments.
    refund_messages = []
    try:
        is_contract = booking.contract_type != 'open-single'
        if is_contract:
            # try to parse booking start datetime (date: YYYY-MM-DD, start_time: e.g. '7:00 PM')
            try:
                start_dt = datetime.strptime(f"{booking.date} {booking.start_time}", "%Y-%m-%d %I:%M %p")
            except Exception:
                start_dt = None

            eligible_refund = False
            if start_dt:
                now = datetime.now()
                if now <= (start_dt - timedelta(hours=12)):
                    eligible_refund = True

            if eligible_refund:
                payments = db.query(Payment).filter(Payment.booking_id == booking.id, Payment.status == 'completed').all()
                for p in payments:
                    refund_amount = round(float(p.amount) * 0.5, 2)
                    # mark original payment refunded
                    p.status = 'refunded'
                    p.admin_notes = (p.admin_notes or '') + f" | 50% refunded (${refund_amount}) by automatic policy"
                    # create a refund record (negative amount)
                    refund = Payment(
                        user_id=booking.user_id,
                        amount=-refund_amount,
                        payment_type='refund',
                        payment_method='refund',
                        related_id=booking.id,
                        booking_id=booking.id,
                        description='50% contract refund',
                        status='completed',
                        admin_notes='Automatic 50% refund for contract cancellation',
                    )
                    db.add(refund)
                    refund_messages.append(f"Processed 50% refund of ${refund_amount} for payment {p.id}")
                db.commit()
                # notify user about refund(s)
                if refund_messages:
                    notif = Notification(
                        user_id=booking.user_id,
                        type='payment',
                        title='Refund Processed',
                        message='A 50% refund was processed for your cancelled contract booking.',
                        action_url='',
                        related_id=booking.id,
                    )
                    db.add(notif)
                    db.commit()

    except Exception:
        # Don't fail deletion if refund processing had an issue — fall back to deletion.
        pass

    db.delete(booking)
    db.commit()
    msg = "Booking deleted"
    if refund_messages:
        msg = "Booking deleted; " + "; ".join(refund_messages)
    return MessageResponse(message=msg)