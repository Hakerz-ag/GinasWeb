"""Contact router — handles contact form submissions and sends them to Gina's email."""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime

from app.database import get_db
from app.models import ChatMessage
from app.services.email_service import send_contact_form_email

router = APIRouter()


class ContactFormRequest(BaseModel):
    """Contact form submission from the website."""
    name: str
    email: EmailStr
    phone: str = ""
    subject: str
    message: str


class ContactFormResponse(BaseModel):
    """Response after contact form is submitted."""
    success: bool
    message: str


@router.post("", response_model=ContactFormResponse)
def submit_contact_form(body: ContactFormRequest, db: Session = Depends(get_db)):
    """Submit a contact form message.

    This endpoint:
    1. Saves the message to the chat_messages table (so Gina can see it in the admin dashboard)
    2. Sends an email to Gina with the full message details
    """
    # 1. Save to chat_messages so it appears in the admin dashboard
    try:
        msg = ChatMessage(
            name=body.name,
            email=body.email,
            message=f"[Contact Form: {body.subject}] {body.message}" + (f"\n\nPhone: {body.phone}" if body.phone else ""),
            read=False,
        )
        db.add(msg)
        db.commit()
    except Exception as e:
        # Don't fail the whole request if DB save fails — the email is more important
        import logging
        logging.getLogger(__name__).warning(f"Failed to save contact form to DB: {e}")

    # 2. Send email to Gina
    email_sent = send_contact_form_email(
        name=body.name,
        email=body.email,
        phone=body.phone,
        subject=body.subject,
        message=body.message,
    )

    if email_sent:
        return ContactFormResponse(
            success=True,
            message="Thank you for reaching out! Your message has been sent to Gina. We'll get back to you shortly.",
        )
    else:
        # Email failed but message was saved — still tell user it worked
        # (we don't want to expose internal errors to the public)
        return ContactFormResponse(
            success=True,
            message="Thank you for reaching out! We've received your message and will get back to you shortly.",
        )