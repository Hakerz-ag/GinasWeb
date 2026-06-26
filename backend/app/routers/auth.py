"""Auth router — login, register, refresh tokens, logout, and password reset."""

from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session, joinedload
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database import get_db
from app.models import User, RefreshToken, PasswordResetToken
from app.schemas import (
    LoginRequest, RegisterRequest, AuthResponse, UserOut, SubAccountOut,
    MessageResponse, RefreshRequest, RefreshResponse, PasswordResetRequest,
    PasswordResetConfirmRequest,
)
from app.services.auth import hash_password, verify_password, create_token, create_refresh_token, decode_token
from app.config import get_settings

router = APIRouter()
settings = get_settings()
limiter = Limiter(key_func=get_remote_address)


def _user_to_out(user: User, db: Session) -> UserOut:
    """Convert a User model to a UserOut schema with classes and bookings."""
    from app.models import ClassEnrollment, ClassSession, CourtBooking

    # Single query with JOIN to avoid N+1 on class enrollments → class sessions
    enrollment_rows = (
        db.query(ClassSession.title)
        .join(ClassEnrollment, ClassEnrollment.class_id == ClassSession.id)
        .filter(ClassEnrollment.user_id == user.id)
        .all()
    )
    class_titles = [row[0] for row in enrollment_rows]

    # Single query for bookings (already efficient, just one query)
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


def _create_tokens(user: User, db: Session) -> dict:
    """Create an access token + refresh token pair and store the refresh token in DB."""
    access_token = create_token(user.id, user.role)
    refresh_token_str = create_refresh_token(user.id, user.role)

    # Decode the refresh token to get the jti and expiry for storage
    payload = decode_token(refresh_token_str)
    jti = payload.get("jti", "")
    expires_at = datetime.utcnow() + timedelta(days=settings.jwt_refresh_expire_days)

    # Store refresh token in DB for revocation tracking
    db.add(RefreshToken(
        user_id=user.id,
        token_jti=jti,
        expires_at=expires_at,
    ))
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token_str,
    }


@router.post("/login", response_model=AuthResponse)
@limiter.limit("5/minute")
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate a user by email + password, return access + refresh tokens."""
    user = db.query(User).options(joinedload(User.sub_accounts)).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if user.status == "suspended":
        raise HTTPException(status_code=403, detail="Account suspended")

    # ── MFA check: if the user has TOTP enabled, don't issue the real token yet ──
    if user.totp_enabled:
        # Issue a short-lived temp token that can ONLY be used for MFA verification
        temp_token = create_token(user.id, user.role, expire_minutes=5)
        return AuthResponse(
            user=_user_to_out(user, db),
            token="",  # Real token withheld until MFA is verified
            mfa_required=True,
            mfa_temp_token=temp_token,
        )

    tokens = _create_tokens(user, db)
    return AuthResponse(
        user=_user_to_out(user, db),
        token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
    )


@router.post("/refresh", response_model=RefreshResponse)
def refresh_token(body: RefreshRequest, db: Session = Depends(get_db)):
    """Exchange a valid refresh token for a new access token + refresh token pair.
    
    This implements refresh token rotation: each refresh token can only be used once.
    After use, the old refresh token is revoked and a new one is issued.
    """
    payload = decode_token(body.refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    # Verify this is a refresh token, not an access token
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Not a refresh token")

    jti = payload.get("jti", "")
    user_id = payload.get("sub", "")

    # Check if the refresh token has been revoked
    stored_token = db.query(RefreshToken).filter(RefreshToken.token_jti == jti).first()
    if not stored_token:
        raise HTTPException(status_code=401, detail="Refresh token not found. Please log in again.")
    if stored_token.revoked:
        # Token reuse detected — revoke ALL refresh tokens for this user (security measure)
        db.query(RefreshToken).filter(RefreshToken.user_id == user_id).update({"revoked": True})
        db.commit()
        raise HTTPException(status_code=401, detail="Refresh token has been revoked. Please log in again.")
    if stored_token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Refresh token has expired. Please log in again.")

    # Get the user
    user = db.query(User).options(joinedload(User.sub_accounts)).filter(User.id == user_id).first()
    if not user or user.status == "suspended":
        raise HTTPException(status_code=401, detail="User not found or suspended")

    # Revoke the old refresh token (rotation)
    stored_token.revoked = True

    # Issue new tokens
    tokens = _create_tokens(user, db)
    return RefreshResponse(
        user=_user_to_out(user, db),
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
    )


@router.post("/logout", response_model=MessageResponse)
def logout(body: RefreshRequest, db: Session = Depends(get_db)):
    """Revoke a refresh token, effectively logging the user out.
    
    The client should also delete the stored access + refresh tokens locally.
    """
    payload = decode_token(body.refresh_token)
    if not payload:
        return MessageResponse(message="Logged out successfully.")

    jti = payload.get("jti", "")
    if jti:
        # Revoke the refresh token
        db.query(RefreshToken).filter(RefreshToken.token_jti == jti).update({"revoked": True})
        db.commit()

    return MessageResponse(message="Logged out successfully.")


@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("3/minute")
def forgot_password(request: Request, body: PasswordResetRequest, db: Session = Depends(get_db)):
    """Request a password reset link. Sends an email with a reset token."""
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        # Don't reveal whether the email exists — return success either way
        return MessageResponse(message="If an account with that email exists, a reset link has been sent.")

    # Create a password reset token
    import secrets
    reset_token = secrets.token_urlsafe(32)
    token_hash = hash_password(reset_token)  # Use bcrypt to hash the token

    # Invalidate any existing reset tokens for this user
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used == False,
    ).update({"used": True})

    # Store the new token
    db.add(PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.utcnow() + timedelta(hours=1),
    ))
    db.commit()

    # Send reset email
    try:
        from app.services.email_service import send_email
        reset_url = f"{settings.frontend_url}/reset-password?token={reset_token}&email={user.email}"
        send_email(
            to_email=user.email,
            subject="Reset Your Password — Gina's Tennis World",
            html_content=f"""
            <h2>Password Reset Request</h2>
            <p>Hi {user.name},</p>
            <p>We received a request to reset your password. Click the link below to set a new password:</p>
            <p><a href="{reset_url}" style="background-color: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Reset Password</a></p>
            <p>This link expires in 1 hour.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <p>— Gina's Tennis World</p>
            """,
        )
    except Exception:
        pass  # Don't fail the request if email sending fails

    return MessageResponse(message="If an account with that email exists, a reset link has been sent.")


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(body: PasswordResetConfirmRequest, db: Session = Depends(get_db)):
    """Reset a user's password using a valid reset token."""
    # Find the user
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid reset link.")

    # Find a valid (unused, not expired) reset token for this user
    reset_tokens = db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at > datetime.utcnow(),
    ).all()

    # Check if any token matches
    valid_token = None
    for rt in reset_tokens:
        if verify_password(body.token, rt.token_hash):
            valid_token = rt
            break

    if not valid_token:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link.")

    # Mark the token as used
    valid_token.used = True

    # Update the user's password
    user.password_hash = hash_password(body.new_password)

    # Revoke all refresh tokens for this user (force re-login on all devices)
    db.query(RefreshToken).filter(RefreshToken.user_id == user.id).update({"revoked": True})
    db.commit()

    return MessageResponse(message="Password reset successfully. Please log in with your new password.")


@router.post("/register", response_model=MessageResponse)
@limiter.limit("3/minute")
def register(request: Request, body: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new customer (pending admin approval)."""
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        name=body.name,
        phone=body.phone,
        role="customer",
        status="pending",
    )
    db.add(user)
    db.commit()
    return MessageResponse(message="Registration submitted. Pending admin approval.")