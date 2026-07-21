"""Email router — mass email by day/time filter with multi-select support."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, ClassEnrollment, ClassSession, CourtBooking
from app.schemas import EmailRequest, EmailResponse
from app.services.email_service import send_broadcast_email
from app.services.auth_middleware import require_admin

router = APIRouter()


@router.post("/send", response_model=EmailResponse)
def send_email(body: EmailRequest, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Send an email to users filtered by class day/time.

    Supports selecting multiple days and times so Gina can notify everyone
    about closures, delayed openings, etc.
    """
    if body.send_to_all:
        # Send to all active customers
        users = db.query(User).filter(User.role == "customer", User.status == "active").all()
    else:
        # Find users who have classes on the given days/times
        user_ids = set()

        if body.days:
            # 1. Users enrolled in classes on these days
            matching_classes = db.query(ClassSession).filter(ClassSession.day_of_week.in_(body.days))
            if body.times:
                matching_classes = matching_classes.filter(ClassSession.start_time.in_(body.times))

            class_ids = [c.id for c in matching_classes.all()]
            if class_ids:
                enrollment_user_ids = db.query(ClassEnrollment.user_id).filter(
                    ClassEnrollment.class_id.in_(class_ids),
                    ClassEnrollment.status == "active",
                ).distinct().all()
                user_ids.update(uid[0] for uid in enrollment_user_ids)

            # 2. Users with bookings on these days
            booking_query = db.query(CourtBooking).filter(
                CourtBooking.deleted_at.is_(None),
                CourtBooking.status.in_(["pending", "approved", "active"]),
            )
            # Filter by day name — bookings store date as "YYYY-MM-DD"
            import calendar
            day_name_to_num = {day: i for i, day in enumerate(calendar.day_name)}
            selected_day_nums = [day_name_to_num.get(d) for d in body.days if day_name_to_num.get(d) is not None]

            if selected_day_nums:
                from sqlalchemy import func
                # Get all bookings and filter by day of week from the date field
                all_bookings = booking_query.all()
                for b in all_bookings:
                    try:
                        from datetime import datetime
                        booking_date = datetime.strptime(b.date, "%Y-%m-%d")
                        if booking_date.weekday() in selected_day_nums:
                            user_ids.add(b.user_id)
                    except (ValueError, TypeError):
                        pass

        if not user_ids:
            return EmailResponse(sent=False, recipient_count=0, message="No students found for the selected day(s)/time(s).")

        users = db.query(User).filter(
            User.id.in_(user_ids),
            User.role == "customer",
            User.status == "active",
        ).all()

    if not users:
        return EmailResponse(sent=False, recipient_count=0, message="No recipients found for the selected filters.")

    # Build recipients list
    recipients = [{"email": u.email, "name": u.name} for u in users]

    # Actually send the emails
    result = send_broadcast_email(
        recipients=recipients,
        subject=body.subject,
        body=body.body,
    )

    sent_count = result["sent_count"]
    failed_count = result["failed_count"]

    if failed_count > 0 and sent_count == 0:
        return EmailResponse(
            sent=False,
            recipient_count=0,
            message=f"Failed to send email to all {failed_count} recipient(s). Please try again.",
        )
    elif failed_count > 0:
        return EmailResponse(
            sent=True,
            recipient_count=sent_count,
            message=f"Email sent to {sent_count} recipient(s). {failed_count} failed to receive.",
        )
    else:
        return EmailResponse(
            sent=True,
            recipient_count=sent_count,
            message=f"Email sent to {sent_count} recipient(s)!",
        )