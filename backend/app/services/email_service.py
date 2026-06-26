"""Email sending service — sends transactional emails via SendGrid (or console in dev)."""

import logging
from typing import Optional

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


def send_email(
    to_email: str,
    subject: str,
    html_body: str,
    from_email: Optional[str] = None,
    from_name: Optional[str] = None,
) -> bool:
    """Send an email using the configured provider.

    Args:
        to_email: Recipient email address.
        subject: Email subject line.
        html_body: HTML content of the email.
        from_email: Sender email (defaults to settings.email_from_address).
        from_name: Sender display name (defaults to settings.email_from_name).

    Returns:
        True if the email was sent successfully, False otherwise.
    """
    sender_email = from_email or settings.email_from_address
    sender_name = from_name or settings.email_from_name

    if settings.email_provider == "sendgrid" and settings.sendgrid_api_key:
        return _send_via_sendgrid(to_email, subject, html_body, sender_email, sender_name)
    else:
        # Fallback: log to console in development
        logger.info(
            f"📧 [DEV] Email not sent (provider={settings.email_provider}). "
            f"To: {to_email}, Subject: {subject}"
        )
        print(f"📧 [DEV] Would send email to: {to_email}")
        print(f"   Subject: {subject}")
        print(f"   From: {sender_name} <{sender_email}>")
        print(f"   Body (first 200 chars): {html_body[:200]}...")
        return True  # Pretend success in dev


def _send_via_sendgrid(
    to_email: str,
    subject: str,
    html_body: str,
    from_email: str,
    from_name: str,
) -> bool:
    """Send email via SendGrid API."""
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail, Email, To, Content

        message = Mail()
        message.from_email = Email(from_email, from_name)
        message.to = To(to_email)
        message.subject = subject
        message.content = Content("text/html", html_body)

        sg = SendGridAPIClient(settings.sendgrid_api_key)
        response = sg.send(message)

        if response.status_code in (200, 201, 202):
            logger.info(f"✅ Email sent to {to_email} via SendGrid (status={response.status_code})")
            return True
        else:
            logger.error(f"❌ SendGrid returned status {response.status_code}: {response.body}")
            return False

    except Exception as e:
        logger.error(f"❌ Failed to send email via SendGrid: {e}")
        return False


def send_contact_form_email(
    name: str,
    email: str,
    phone: str,
    subject: str,
    message: str,
) -> bool:
    """Send a contact form submission to Gina's email.

    This formats the contact form data into a nice HTML email and sends it
    to the configured contact email address (Gina's email).
    """
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #166534, #15803d); padding: 20px 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #facc15; margin: 0; font-size: 24px;">📬 New Contact Form Message</h1>
            <p style="color: #bbf7d0; margin: 5px 0 0 0; font-size: 14px;">Gina's Tennis World Website</p>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 100px;">Name:</td>
                    <td style="padding: 8px 0; color: #1f2937;">{name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #374151;">Email:</td>
                    <td style="padding: 8px 0;"><a href="mailto:{email}" style="color: #15803d;">{email}</a></td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #374151;">Phone:</td>
                    <td style="padding: 8px 0; color: #1f2937;">{phone or 'Not provided'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #374151;">Subject:</td>
                    <td style="padding: 8px 0; color: #1f2937;">{subject}</td>
                </tr>
            </table>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <h3 style="color: #166534; margin: 0 0 10px 0;">Message:</h3>
            <p style="color: #374151; line-height: 1.6; white-space: pre-wrap;">{message}</p>
        </div>
        <div style="background: #f0fdf4; padding: 15px 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
                This message was sent through the contact form on Gina's Tennis World website.
                <br />Reply directly to this email or contact the sender at <a href="mailto:{email}" style="color: #15803d;">{email}</a>.
            </p>
        </div>
    </div>
    """

    return send_email(
        to_email=settings.contact_email,
        subject=f"Contact Form: {subject} — from {name}",
        html_body=html,
        from_email=settings.email_from_address,
        from_name=f"Website Contact Form",
    )


def send_booking_confirmation_email(
    to_email: str,
    name: str,
    booking_details: str,
) -> bool:
    """Send a booking confirmation email to the customer."""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #166534, #15803d); padding: 20px 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #facc15; margin: 0; font-size: 24px;">🎾 Booking Confirmed!</h1>
            <p style="color: #bbf7d0; margin: 5px 0 0 0; font-size: 14px;">Gina's Tennis World</p>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="color: #374151;">Hi {name},</p>
            <p style="color: #374151;">Your booking request has been submitted. Here are the details:</p>
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #bbf7d0;">
                {booking_details}
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                We'll review your booking and confirm it shortly. If you have any questions, 
                call us at 908-464-9591 or reply to this email.
            </p>
        </div>
    </div>
    """
    return send_email(
        to_email=to_email,
        subject="Booking Request Received — Gina's Tennis World",
        html_body=html,
    )