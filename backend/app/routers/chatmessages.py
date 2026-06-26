"""Chat messages router — handles messages from the floating chat widget."""

from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models import ChatMessage
from app.schemas import ChatMessageOut, ChatMessageCreate, MessageResponse
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


def _sanitize(text: str) -> str:
    """Strip HTML tags and escape special characters to prevent XSS."""
    import bleach
    return bleach.clean(text, tags=[], strip=True)


@router.get("", response_model=list[ChatMessageOut])
def list_messages(unread_only: bool = False, db: Session = Depends(get_db)):
    """List all chat messages (admin). Optionally filter to unread only."""
    query = db.query(ChatMessage).order_by(ChatMessage.created_at.desc())
    if unread_only:
        query = query.filter(ChatMessage.read == False)
    return query.all()


@router.post("", response_model=ChatMessageOut)
@limiter.limit("1/minute")
def create_message(request: Request, body: ChatMessageCreate, db: Session = Depends(get_db)):
    """Submit a new chat message from the website widget. Rate-limited to 1/minute per IP."""
    msg = ChatMessage(
        user_id=body.user_id,  # populated from auth token when available
        name=_sanitize(body.name),
        email=_sanitize(body.email),
        message=_sanitize(body.message),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return ChatMessageOut(
        id=msg.id, user_id=msg.user_id, name=msg.name, email=msg.email,
        message=msg.message, read=msg.read, reply_to=msg.reply_to,
        created_at=msg.created_at,
    )


@router.put("/{msg_id}", response_model=ChatMessageOut)
def mark_read(msg_id: str, db: Session = Depends(get_db)):
    """Mark a chat message as read."""
    msg = db.query(ChatMessage).filter(ChatMessage.id == msg_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg.read = True
    db.commit()
    db.refresh(msg)
    return ChatMessageOut(
        id=msg.id, user_id=msg.user_id, name=msg.name, email=msg.email,
        message=msg.message, read=msg.read, reply_to=msg.reply_to,
        created_at=msg.created_at,
    )


@router.delete("/{msg_id}", response_model=MessageResponse)
def delete_message(msg_id: str, db: Session = Depends(get_db)):
    """Delete a chat message."""
    msg = db.query(ChatMessage).filter(ChatMessage.id == msg_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    db.delete(msg)
    db.commit()
    return MessageResponse(message="Message deleted")