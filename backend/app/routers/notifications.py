"""Notifications router — CRUD and real-time notification management."""

import bleach
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Notification
from app.schemas import NotificationOut, NotificationCreate, NotificationUpdate, MessageResponse

router = APIRouter()


def _sanitize(text: str) -> str:
    """Strip HTML tags and escape special characters to prevent XSS."""
    return bleach.clean(text, tags=[], strip=True)


@router.get("", response_model=list[NotificationOut])
def list_notifications(
    user_id: str = None,
    unread_only: bool = False,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """List notifications, optionally filter by user and read status."""
    query = db.query(Notification)
    if user_id:
        query = query.filter(Notification.user_id == user_id)
    if unread_only:
        query = query.filter(Notification.read == False)  # noqa: E712
    query = query.order_by(Notification.created_at.desc())
    return query.offset(offset).limit(limit).all()


@router.get("/unread-count")
def get_unread_count(user_id: str, db: Session = Depends(get_db)):
    """Get the count of unread notifications for a user."""
    count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.read == False,  # noqa: E712
    ).count()
    return {"unread_count": count}


@router.post("", response_model=NotificationOut, status_code=201)
def create_notification(body: NotificationCreate, db: Session = Depends(get_db)):
    """Create a new notification (called internally when events happen)."""
    notif = Notification(
        user_id=body.user_id,
        type=body.type,
        title=_sanitize(body.title),
        message=_sanitize(body.message),
        action_url=body.action_url,
        related_id=body.related_id,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


@router.put("/{notification_id}", response_model=NotificationOut)
def update_notification(notification_id: str, body: NotificationUpdate, db: Session = Depends(get_db)):
    """Mark a notification as read/unread."""
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    if body.read is not None:
        notif.read = body.read
    db.commit()
    db.refresh(notif)
    return notif


@router.put("/mark-all-read/{user_id}", response_model=MessageResponse)
def mark_all_read(user_id: str, db: Session = Depends(get_db)):
    """Mark all notifications as read for a user."""
    db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.read == False,  # noqa: E712
    ).update({"read": True})
    db.commit()
    return MessageResponse(message="All notifications marked as read")


@router.delete("/{notification_id}", response_model=MessageResponse)
def delete_notification(notification_id: str, db: Session = Depends(get_db)):
    """Delete a notification."""
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(notif)
    db.commit()
    return MessageResponse(message="Notification deleted")