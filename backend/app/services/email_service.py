"""Email sending service — sends transactional emails via SendGrid, Gmail SMTP, or console (dev)."""

import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
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
    elif settings.email_provider == "sendgrid" and not settings.sendgrid_api_key:
        # SendGrid is configured as provider but no API key — this is a misconfiguration
        logger.error(
            f"❌ EMAIL NOT SENT: email_provider is 'sendgrid' but SENDGRID_API_KEY is not set. "
            f"To: {to_email}, Subject: {subject}"
        )
        return False
    elif settings.email_provider == "gmail":
        return _send_via_gmail(to_email, subject, html_body, sender_email, sender_name)
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


def _send_via_gmail(
    to_email: str,
    subject: str,
    html_body: str,
    from_email: str,
    from_name: str,
) -> bool:
    """Send email via Gmail SMTP using an App Password.

    Setup:
    1. Go to https://myaccount.google.com/security
    2. Enable 2-Step Verification (if not already enabled)
    3. Go to https://myaccount.google.com/apppasswords
    4. Create an App Password for "Mail" on "Other (Custom name)" → e.g. "Ginas Tennis World"
    5. Set GMAIL_APP_PASSWORD to the 16-character password (no spaces)
    6. Set EMAIL_PROVIDER=gmail, GMAIL_USER=ginastennisworld@gmail.com
    """
    gmail_user = settings.gmail_user
    gmail_app_password = settings.gmail_app_password

    if not gmail_user or not gmail_app_password:
        logger.error(
            f"❌ EMAIL NOT SENT: Gmail provider selected but GMAIL_USER or GMAIL_APP_PASSWORD not set. "
            f"To: {to_email}, Subject: {subject}"
        )
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{gmail_user}>"
        msg["To"] = to_email

        # Add HTML part
        html_part = MIMEText(html_body, "html")
        msg.attach(html_part)

        # Connect to Gmail SMTP
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.ehlo()
            server.starttls()  # Secure the connection
            server.ehlo()
            server.login(gmail_user, gmail_app_password)
            server.sendmail(gmail_user, to_email, msg.as_string())

        logger.info(f"✅ Email sent to {to_email} via Gmail SMTP")
        return True

    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"❌ Gmail SMTP authentication failed: {e}. Check GMAIL_USER and GMAIL_APP_PASSWORD.")
        return False
    except Exception as e:
        logger.error(f"❌ Failed to send email via Gmail SMTP: {e}")
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


def send_registration_email(to_email: str, name: str, phone: str, details: str = "") -> bool:
        """Send a registration received email to the admin and a confirmation to the user.

        `to_email` is the registrant's email. The admin contact address is taken
        from settings.contact_email inside this helper when sending to Gina.
        """
        admin_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #166534, #15803d); padding: 20px 30px; border-radius: 12px 12px 0 0;">
                <h1 style="color: #facc15; margin: 0; font-size: 20px;">📥 New Registration Received</h1>
            </div>
            <div style="background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
                <p style="color: #374151;">Name: <strong>{name}</strong></p>
                <p style="color: #374151;">Email: <a href="mailto:{to_email}" style="color: #15803d;">{to_email}</a></p>
                <p style="color: #374151;">Phone: {phone or 'Not provided'}</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 12px 0;" />
                <p style="color: #374151; white-space: pre-wrap;">{details}</p>
            </div>
            <div style="background: #f0fdf4; padding: 12px 20px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">This message was sent automatically by the website.</p>
            </div>
        </div>
        """

        user_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #166534, #15803d); padding: 20px 30px; border-radius: 12px 12px 0 0;">
                <h1 style="color: #facc15; margin: 0; font-size: 20px;">🎉 Registration Received</h1>
            </div>
            <div style="background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
                <p style="color: #374151;">Hi {name},</p>
                <p style="color: #374151;">We received your registration. Your account is pending admin approval.</p>
                <p style="color: #374151;">If this was a class registration, Gina will contact you with next steps. If you have questions, reply to this email or call 908-464-9591.</p>
                <div style="background: #f0fdf4; padding: 12px; border-radius: 8px; margin-top: 12px;">{details}</div>
            </div>
        </div>
        """

        # Send admin copy
        try:
                send_email(
                        to_email=settings.contact_email,
                        subject=f"New Registration — {name}",
                        html_body=admin_html,
                )
        except Exception:
                pass

        # Send confirmation to user
        try:
                return send_email(
                        to_email=to_email,
                        subject="Registration Received — Gina's Tennis World",
                        html_body=user_html,
                )
        except Exception:
                return False


def send_enrollment_email(to_email: str, student_name: str, class_title: str, class_info: str, cost: float) -> bool:
        """Notify Gina and the student when an enrollment is created."""
        admin_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #166534, #15803d); padding: 20px 30px; border-radius: 12px 12px 0 0;">
                <h1 style="color: #facc15; margin: 0; font-size: 20px;">📝 New Enrollment</h1>
            </div>
            <div style="background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
                <p><strong>Student:</strong> {student_name}</p>
                <p><strong>Class:</strong> {class_title}</p>
                <p><strong>Info:</strong> {class_info}</p>
                <p><strong>Cost:</strong> ${cost:.2f}</p>
            </div>
        </div>
        """

        user_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #166534, #15803d); padding: 20px 30px; border-radius: 12px 12px 0 0;">
                <h1 style="color: #facc15; margin: 0; font-size: 20px;">📬 Class Registration Received</h1>
            </div>
            <div style="background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
                <p>Hi {student_name},</p>
                <p>We've received your enrollment for <strong>{class_title}</strong>.</p>
                <p><strong>Class details:</strong></p>
                <div style="background:#f0fdf4;padding:10px;border-radius:8px;">{class_info}</div>
                <p style="margin-top:8px;">Cost: <strong>${cost:.2f}</strong></p>
                <p>If you did not intend to enroll, reply to this email or call 908-464-9591.</p>
            </div>
        </div>
        """

        try:
                send_email(
                        to_email=settings.contact_email,
                        subject=f"New Enrollment — {student_name} — {class_title}",
                        html_body=admin_html,
                )
        except Exception:
                pass

        try:
                return send_email(
                        to_email=to_email,
                        subject=f"Enrollment Received — {class_title}",
                        html_body=user_html,
                )
        except Exception:
                return False


def send_contract_time_email(
    to_email: str,
    name: str,
    contract_day: str,
    contract_category: str,
    contract_time: str,
    contract_level: str,
    contract_rate: str,
    contract_dates: str = "",
    contract_ages: str = "",
    contract_play: str = "",
    contract_classes: int = 0,
) -> bool:
    """Send a confirmation email when someone selects a contract time slot.

    This notifies both the customer and Gina about the contract time selection.
    """
    # Build details HTML
    details_rows = f"""
        <tr><td style="padding: 8px 0; font-weight: bold; color: #374151; width: 120px;">Day:</td>
            <td style="padding: 8px 0; color: #1f2937;">{contract_day}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Program:</td>
            <td style="padding: 8px 0; color: #1f2937;">{contract_category}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Time:</td>
            <td style="padding: 8px 0; color: #1f2937;">{contract_time}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Level:</td>
            <td style="padding: 8px 0; color: #1f2937;">{contract_level}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Rate:</td>
            <td style="padding: 8px 0; color: #1f2937;">{contract_rate}</td></tr>
    """
    if contract_dates:
        details_rows += f"""
        <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Dates:</td>
            <td style="padding: 8px 0; color: #1f2937;">{contract_dates}</td></tr>
        """
    if contract_classes:
        details_rows += f"""
        <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Classes:</td>
            <td style="padding: 8px 0; color: #1f2937;">{contract_classes}</td></tr>
        """
    if contract_ages:
        details_rows += f"""
        <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Ages:</td>
            <td style="padding: 8px 0; color: #1f2937;">{contract_ages}</td></tr>
        """
    if contract_play and contract_play != "No":
        details_rows += f"""
        <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Play Time:</td>
            <td style="padding: 8px 0; color: #1f2937;">{contract_play}</td></tr>
        """

    # Email to customer
    user_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #166534, #15803d); padding: 20px 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #facc15; margin: 0; font-size: 24px;">🎾 Contract Time Selected!</h1>
            <p style="color: #bbf7d0; margin: 5px 0 0 0; font-size: 14px;">Gina's Tennis World</p>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="color: #374151;">Hi {name},</p>
            <p style="color: #374151;">Your contract time selection has been received. Here are the details:</p>
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #bbf7d0;">
                <table style="width: 100%; border-collapse: collapse;">
                    {details_rows}
                </table>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                Gina will review your selection and confirm your spot. If you have any questions,
                call us at 908-464-9591 or reply to this email.
            </p>
        </div>
        <div style="background: #f0fdf4; padding: 15px 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
                This confirmation was sent from Gina's Tennis World website.
            </p>
        </div>
    </div>
    """

    # Email to admin (Gina)
    admin_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #166534, #15803d); padding: 20px 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #facc15; margin: 0; font-size: 20px;">📋 New Contract Time Selection</h1>
        </div>
        <div style="background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
            <p><strong>Customer:</strong> {name} ({to_email})</p>
            <table style="width: 100%; border-collapse: collapse;">
                {details_rows}
            </table>
        </div>
    </div>
    """

    # Send admin copy
    try:
        send_email(
            to_email=settings.contact_email,
            subject=f"Contract Time Selection — {name} — {contract_day} {contract_category} {contract_time}",
            html_body=admin_html,
        )
    except Exception:
        pass

    # Send confirmation to customer
    try:
        return send_email(
            to_email=to_email,
            subject=f"Contract Time Confirmed — {contract_day} {contract_time} — Gina's Tennis World",
            html_body=user_html,
        )
    except Exception:
        return False


def send_booking_email(
    to_email: str,
    name: str,
    court_number: int,
    date: str,
    start_time: str,
    end_time: str,
    contract_type: str = "open-single",
    ball_machine: bool = False,
    party_size: int = 2,
    notes: str = "",
) -> bool:
    """Send a booking confirmation email to the customer and a notification to Gina.

    Called when someone books a court.
    """
    # Format contract type for display
    contract_label = {
        "open-single": "Single Session",
        "15-week": "15-Week Contract",
        "30-week": "30-Week Contract",
    }.get(contract_type, contract_type)

    # Build details rows
    details = f"""
        <tr><td style="padding: 8px 0; font-weight: bold; color: #374151; width: 120px;">Date:</td>
            <td style="padding: 8px 0; color: #1f2937;">{date}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Time:</td>
            <td style="padding: 8px 0; color: #1f2937;">{start_time} – {end_time}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Court:</td>
            <td style="padding: 8px 0; color: #1f2937;">Court {court_number}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Type:</td>
            <td style="padding: 8px 0; color: #1f2937;">{contract_label}</td></tr>
    """
    if ball_machine:
        details += f"""
        <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Ball Machine:</td>
            <td style="padding: 8px 0; color: #1f2937;">Yes 🎾</td></tr>
        """
    if party_size and party_size > 1:
        details += f"""
        <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Party Size:</td>
            <td style="padding: 8px 0; color: #1f2937;">{party_size} people</td></tr>
        """
    if notes:
        details += f"""
        <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Notes:</td>
            <td style="padding: 8px 0; color: #1f2937;">{notes}</td></tr>
        """

    # Email to customer
    user_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #166534, #15803d); padding: 20px 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #facc15; margin: 0; font-size: 24px;">🎾 Booking Request Received!</h1>
            <p style="color: #bbf7d0; margin: 5px 0 0 0; font-size: 14px;">Gina's Tennis World</p>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="color: #374151;">Hi {name},</p>
            <p style="color: #374151;">Your court booking request has been submitted. Here are the details:</p>
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #bbf7d0;">
                <table style="width: 100%; border-collapse: collapse;">
                    {details}
                </table>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                Gina will review your booking and confirm it shortly. If you have any questions,
                call us at 908-464-9591 or reply to this email.
            </p>
        </div>
        <div style="background: #f0fdf4; padding: 15px 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
                This confirmation was sent from Gina's Tennis World website.
            </p>
        </div>
    </div>
    """

    # Email to Gina (admin)
    admin_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #166534, #15803d); padding: 20px 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #facc15; margin: 0; font-size: 20px;">📋 New Court Booking</h1>
        </div>
        <div style="background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
            <p><strong>Customer:</strong> {name} ({to_email})</p>
            <table style="width: 100%; border-collapse: collapse;">
                {details}
            </table>
        </div>
    </div>
    """

    # Send admin copy
    try:
        send_email(
            to_email=settings.contact_email,
            subject=f"New Court Booking — {name} — {date} {start_time}",
            html_body=admin_html,
        )
    except Exception:
        pass

    # Send confirmation to customer
    try:
        return send_email(
            to_email=to_email,
            subject=f"Booking Request Received — {date} {start_time} — Gina's Tennis World",
            html_body=user_html,
        )
    except Exception:
        return False


def send_assessment_email(
    to_email: str,
    name: str,
    date: str,
    start_time: str,
    end_time: str,
    sub_account_name: str = "",
) -> bool:
    """Send an assessment/private lesson request email to the customer and Gina.

    Called when someone books a 1-on-1 assessment or private lesson.
    """
    student_label = f" ({sub_account_name})" if sub_account_name else ""

    # Email to customer
    user_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #166534, #15803d); padding: 20px 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #facc15; margin: 0; font-size: 24px;">🎾 Assessment Request Received!</h1>
            <p style="color: #bbf7d0; margin: 5px 0 0 0; font-size: 14px;">Gina's Tennis World</p>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="color: #374151;">Hi {name},</p>
            <p style="color: #374151;">Your 1-on-1 assessment request has been submitted. Here are the details:</p>
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #bbf7d0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px 0; font-weight: bold; color: #374151; width: 120px;">Date:</td>
                        <td style="padding: 8px 0; color: #1f2937;">{date}</td></tr>
                    <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Time:</td>
                        <td style="padding: 8px 0; color: #1f2937;">{start_time} – {end_time}</td></tr>
                    <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Type:</td>
                        <td style="padding: 8px 0; color: #1f2937;">1-on-1 Assessment{student_label}</td></tr>
                </table>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                Gina will review your request and confirm the session. If you have any questions,
                call us at 908-464-9591 or reply to this email.
            </p>
        </div>
        <div style="background: #f0fdf4; padding: 15px 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
                This confirmation was sent from Gina's Tennis World website.
            </p>
        </div>
    </div>
    """

    # Email to Gina (admin)
    admin_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #166534, #15803d); padding: 20px 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #facc15; margin: 0; font-size: 20px;">📋 New Assessment Request</h1>
        </div>
        <div style="background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
            <p><strong>Customer:</strong> {name} ({to_email}){student_label}</p>
            <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; font-weight: bold; color: #374151; width: 120px;">Date:</td>
                    <td style="padding: 8px 0; color: #1f2937;">{date}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Time:</td>
                    <td style="padding: 8px 0; color: #1f2937;">{start_time} – {end_time}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Type:</td>
                    <td style="padding: 8px 0; color: #1f2937;">1-on-1 Assessment{student_label}</td></tr>
            </table>
        </div>
    </div>
    """

    # Send admin copy
    try:
        send_email(
            to_email=settings.contact_email,
            subject=f"New Assessment Request — {name}{student_label} — {date} {start_time}",
            html_body=admin_html,
        )
    except Exception:
        pass

    # Send confirmation to customer
    try:
        return send_email(
            to_email=to_email,
            subject=f"Assessment Request Received — {date} — Gina's Tennis World",
            html_body=user_html,
        )
    except Exception:
        return False


def send_broadcast_email(
    recipients: list,
    subject: str,
    body: str,
    from_name: str = None,
) -> dict:
    """Send an email to multiple recipients (broadcast).

    Used by the admin to notify students about closures, schedule changes, etc.

    Args:
        recipients: List of dicts with 'email' and 'name' keys.
        subject: Email subject line.
        body: Plain text message from Gina.
        from_name: Sender display name (defaults to settings).

    Returns:
        Dict with 'sent_count', 'failed_count', and 'failed_emails'.
    """
    sender_name = from_name or settings.email_from_name
    sent_count = 0
    failed_count = 0
    failed_emails = []

    for recipient in recipients:
        to_email = recipient.get("email", "")
        name = recipient.get("name", "Student")

        # Build a nice HTML email from the plain text body
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #166534, #15803d); padding: 20px 30px; border-radius: 12px 12px 0 0;">
                <h1 style="color: #facc15; margin: 0; font-size: 22px;">🎾 Message from Gina's Tennis World</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
                <p style="color: #374151;">Hi {name},</p>
                <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #bbf7d0; margin: 16px 0;">
                    <p style="color: #374151; line-height: 1.6; white-space: pre-wrap;">{body}</p>
                </div>
                <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                    If you have any questions, call us at 908-464-9591 or reply to this email.
                </p>
            </div>
            <div style="background: #f0fdf4; padding: 15px 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                    This message was sent from Gina's Tennis World. You're receiving this because you're enrolled in one of our programs.
                </p>
            </div>
        </div>
        """

        success = send_email(
            to_email=to_email,
            subject=subject,
            html_body=html_body,
            from_name=sender_name,
        )
        if success:
            sent_count += 1
        else:
            failed_count += 1
            failed_emails.append(to_email)

    return {
        "sent_count": sent_count,
        "failed_count": failed_count,
        "failed_emails": failed_emails,
    }