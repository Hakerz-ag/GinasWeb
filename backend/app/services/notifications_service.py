"""Notification sending service: email (placeholder) and SMS via Twilio if configured."""
from typing import Optional
import logging

from app.config import get_settings

settings = get_settings()

try:
    from twilio.rest import Client as TwilioClient
    _have_twilio = True
except Exception:
    _have_twilio = False

logger = logging.getLogger(__name__)


def send_sms(to_number: str, message: str) -> dict:
    """Send an SMS via Twilio when credentials are present.

    Returns a dict with keys: sent (bool), sid (str|None), message (str)
    """
    if not (settings.twilio_account_sid and settings.twilio_auth_token and settings.twilio_from_number):
        logger.info("Twilio not configured — SMS not sent. Would send to %s: %s", to_number, message)
        return {"sent": False, "sid": None, "message": "Twilio not configured. SMS not sent."}

    if not _have_twilio:
        logger.warning("twilio package not installed; cannot send SMS")
        return {"sent": False, "sid": None, "message": "Twilio library not available."}

    try:
        client = TwilioClient(settings.twilio_account_sid, settings.twilio_auth_token)
        msg = client.messages.create(body=message, from_=settings.twilio_from_number, to=to_number)
        logger.info("Sent SMS via Twilio SID=%s to %s", getattr(msg, 'sid', None), to_number)
        return {"sent": True, "sid": getattr(msg, 'sid', None), "message": "Sent"}
    except Exception as e:
        logger.exception("Twilio send failed")
        return {"sent": False, "sid": None, "message": str(e)}
