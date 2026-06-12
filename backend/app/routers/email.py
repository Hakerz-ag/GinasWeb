"""Email router — mass email by day/time filter with multi-select support."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, ClassEnrollment, ClassSession
from app.schemas import EmailRequest, EmailResponse

router = APIRouter()


@router.post("/send", response_model=EmailResponse)
def send_email(body: EmailRequest, db: Session = Depends(get_db)):
    """Send an email to users filtered by class day/time.

    Supports selecting multiple days and times so Gina can notify everyone
    about closures, delayed openings, etc.

    In production, this would integrate with an email service (Resend, SendGrid, etc.).
    For now, it returns the list of recipients that WOULD receive the email.
    """
    if body.send_to_all:
        # Send to all active customers
        recipients = db.query(User).filter(User.role == "customer", User.status == "active").all()
    else:
        # Find users who have classes on the given days/times
        query = db.query(User).filter(User.role == "customer", User.status == "active")

        if body.days:
            matching_classes = db.query(ClassSession).filter(ClassSession.day_of_week.in_(body.days))
            if body.times:
                matching_classes = matching_classes.filter(ClassSession.start_time.in_(body.times))

            class_ids = [c.id for c in matching_classes.all()]
            if class_ids:
                user_ids = db.query(ClassEnrollment.user_id).filter(
                    ClassEnrollment.class_id.in_(class_ids),
                    ClassEnrollment.status == "active",
                ).distinct().all()
                user_ids = [uid[0] for uid in user_ids]
                query = query.filter(User.id.in_(user_ids))
            else:
                return EmailResponse(sent=False, recipient_count=0, message="No students found for the selected day(s)/time(s).")

        recipients = query.all()

    # In production: send actual emails via Resend/SendGrid
    print(f"📧 Would send email to {len(recipients)} recipients:")
    print(f"   Subject: {body.subject}")
    print(f"   Body: {body.body[:100]}...")

    return EmailResponse(
        sent=True,
        recipient_count=len(recipients),
        message=f"Email queued for {len(recipients)} recipient(s).",
    )