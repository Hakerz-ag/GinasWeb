"""MFA router — TOTP-based multi-factor authentication for admin accounts.

How MFA works:
1. Admin goes to Settings → Enable MFA
2. Frontend calls POST /auth/mfa/setup → gets a QR code (TOTP URI)
3. Admin scans the QR code with Google Authenticator / Authy / etc.
4. Admin enters the 6-digit code from their app
5. Frontend calls POST /auth/mfa/verify-setup → verifies the code and enables MFA
6. On future logins, if MFA is enabled, the login response includes mfa_required=True
7. Frontend shows an OTP input, user enters the code
8. Frontend calls POST /auth/mfa/verify → verifies the code and returns the real auth token
"""

import io
import base64
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import pyotp
import qrcode

from app.database import get_db
from app.models import User, RefreshToken
from app.schemas import MFASetupResponse, MFAVerifyRequest, MFAVerifyResponse, UserOut, SubAccountOut
from app.services.auth import decode_token, create_token, create_refresh_token
from app.services.auth_middleware import get_current_user
from app.config import get_settings

router = APIRouter()


def _user_to_out(user: User, db: Session) -> UserOut:
    """Convert a User model to a UserOut schema with classes and bookings."""
    from app.models import ClassEnrollment, ClassSession, CourtBooking

    enrollment_rows = (
        db.query(ClassSession.title)
        .join(ClassEnrollment, ClassEnrollment.class_id == ClassSession.id)
        .filter(ClassEnrollment.user_id == user.id)
        .all()
    )
    class_titles = [row[0] for row in enrollment_rows]

    user_bookings = db.query(CourtBooking).filter(CourtBooking.user_id == user.id).all()
    booking_summaries = [f"Court {b.court_number} — {b.date}" for b in user_bookings]

    return UserOut(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        phone=user.phone or "",
        birth_date=user.birth_date or "",
        skill_level=user.skill_level or "none",
        assessment_completed=user.assessment_completed or False,
        sessions_taken=user.sessions_taken or 0,
        status=user.status,
        totp_enabled=user.totp_enabled or False,
        created_at=user.created_at,
        sub_accounts=[SubAccountOut(
            id=s.id, name=s.name, birth_date=s.birth_date or "",
            phone=s.phone or "", email=s.email or "",
            relationship=s.relationship_type, skill_level=s.skill_level or "none",
            assessment_completed=s.assessment_completed or False,
            sessions_taken=s.sessions_taken or 0,
        ) for s in user.sub_accounts],
        classes=class_titles,
        bookings=booking_summaries,
    )


@router.post("/setup", response_model=MFASetupResponse)
def setup_mfa(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Generate a TOTP secret and QR code for the current user.
    
    The user must scan this QR code with an authenticator app (Google Authenticator,
    Authy, 1Password, etc.) and then verify with POST /mfa/verify-setup to enable MFA.
    
    This endpoint does NOT enable MFA yet — the user must verify a code first.
    """
    # Generate a new TOTP secret
    secret = pyotp.random_base32()
    
    # Build the otpauth:// URI
    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(
        name=current_user.email,
        issuer_name="Gina's Tennis World"
    )
    
    # Generate QR code as a base64-encoded PNG data URL
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    qr_data_url = f"data:image/png;base64,{qr_base64}"
    
    # Save the secret to the user (but don't enable MFA yet)
    current_user.totp_secret = secret
    db.commit()
    
    return MFASetupResponse(
        secret=secret,
        uri=uri,
        qr_code_data_url=qr_data_url,
    )


@router.post("/verify-setup", response_model=MFAVerifyResponse)
def verify_mfa_setup(
    code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Verify a TOTP code during MFA setup to confirm the user has configured their app correctly.
    
    If the code is valid, MFA is enabled for the user.
    """
    if not current_user.totp_secret:
        raise HTTPException(status_code=400, detail="MFA setup not initiated. Call /mfa/setup first.")
    
    if current_user.totp_enabled:
        raise HTTPException(status_code=400, detail="MFA is already enabled for this account.")
    
    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid verification code. Please try again.")
    
    # Enable MFA
    current_user.totp_enabled = True
    db.commit()
    db.refresh(current_user)
    
    # Issue a fresh real auth token + refresh token
    from datetime import datetime, timedelta
    settings = get_settings()
    access_token = create_token(current_user.id, current_user.role)
    refresh_token_str = create_refresh_token(current_user.id, current_user.role)
    payload = decode_token(refresh_token_str)
    jti = payload.get("jti", "")
    expires_at = datetime.utcnow() + timedelta(days=settings.jwt_refresh_expire_days)
    db.add(RefreshToken(user_id=current_user.id, token_jti=jti, expires_at=expires_at))
    db.commit()
    
    return MFAVerifyResponse(
        user=_user_to_out(current_user, db),
        token=access_token,
    )


@router.post("/verify", response_model=MFAVerifyResponse)
def verify_mfa_login(body: MFAVerifyRequest, db: Session = Depends(get_db)):
    """Verify a TOTP code during login (after password auth succeeded but MFA was required).
    
    The frontend receives a temp_token from the login response when mfa_required=True.
    It then calls this endpoint with the temp_token and the 6-digit code from the user's
    authenticator app.
    
    If valid, returns the real auth token.
    """
    # Decode the temp token to get the user ID
    payload = decode_token(body.temp_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired MFA session. Please log in again.")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid MFA session.")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    if not user.totp_enabled or not user.totp_secret:
        raise HTTPException(status_code=400, detail="MFA is not enabled for this account.")
    
    # Verify the TOTP code
    totp = pyotp.TOTP(user.totp_secret)
    if not totp.verify(body.code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid verification code. Please try again.")
    
    # Issue the real auth token + refresh token
    from datetime import datetime, timedelta
    settings = get_settings()
    access_token = create_token(user.id, user.role)
    refresh_token_str = create_refresh_token(user.id, user.role)
    rt_payload = decode_token(refresh_token_str)
    jti = rt_payload.get("jti", "")
    expires_at = datetime.utcnow() + timedelta(days=settings.jwt_refresh_expire_days)
    db.add(RefreshToken(user_id=user.id, token_jti=jti, expires_at=expires_at))
    db.commit()
    
    return MFAVerifyResponse(
        user=_user_to_out(user, db),
        token=access_token,
    )


@router.post("/disable")
def disable_mfa(
    code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Disable MFA for the current user. Requires a valid TOTP code to confirm."""
    if not current_user.totp_enabled:
        raise HTTPException(status_code=400, detail="MFA is not enabled for this account.")
    
    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid verification code. Please try again.")
    
    current_user.totp_enabled = False
    current_user.totp_secret = None
    db.commit()
    
    return {"message": "MFA has been disabled for your account."}