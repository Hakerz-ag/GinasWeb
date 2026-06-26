"""Authentication dependency — verifies JWT tokens and returns the current user."""

from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.services.auth import decode_token


def get_current_user(
    authorization: str = Header(None, alias="Authorization"),
    db: Session = Depends(get_db),
) -> User:
    """Extract and verify the JWT token from the Authorization header.

    Returns the authenticated User object.
    Raises 401 if no token or invalid token.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Strip "Bearer " prefix if present
    token = authorization
    if token.startswith("Bearer "):
        token = token[7:]

    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if user.status == "suspended":
        raise HTTPException(status_code=403, detail="Account suspended")

    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require that the current user is an admin.

    Raises 403 if the user is not an admin.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user