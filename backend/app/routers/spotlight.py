"""Spotlight router — Student of the Month management (admin).

Allows uploading spotlight images and descriptions which are shown on the public homepage.
"""

import os
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Spotlight
from app.schemas import MessageResponse
from app.services.auth_middleware import require_admin
from app.config import get_settings

router = APIRouter()
settings = get_settings()


@router.get("", response_model=list)
def list_spotlight(db: Session = Depends(get_db)):
    entries = db.query(Spotlight).order_by(Spotlight.sort_order.asc(), Spotlight.created_at.desc()).all()
    out = []
    for e in entries:
        out.append({
            'id': e.id,
            'user_id': e.user_id,
            'title': e.title,
            'description': e.description,
            'image_path': e.image_path,
            'is_adult': e.is_adult,
            'sort_order': e.sort_order,
        })
    return out


@router.post("", response_model=MessageResponse)
def upload_spotlight(
    title: str = Form(...),
    description: str = Form(''),
    is_adult: bool = Form(True),
    user_id: str | None = Form(None),
    sort_order: int = Form(0),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    _admin = Depends(require_admin),
):
    """Upload an image and create a spotlight entry (admin only).

    Saves the file under `public/uploads/spotlight/` and stores the path.
    Image is optional — entries can be created with just a title and description.
    """
    rel_path = ""
    if file:
        uploads_dir = os.path.abspath(os.path.join(os.getcwd(), 'public', 'uploads', 'spotlight'))
        os.makedirs(uploads_dir, exist_ok=True)

        filename = f"{file.filename}"
        target_path = os.path.join(uploads_dir, filename)
        try:
            with open(target_path, 'wb') as f:
                f.write(file.file.read())
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

        rel_path = f"/uploads/spotlight/{filename}"

    entry = Spotlight(user_id=user_id, title=title, description=description, image_path=rel_path, is_adult=is_adult, sort_order=sort_order)
    db.add(entry)
    db.commit()
    return MessageResponse(message="Uploaded spotlight entry")


@router.put("/{spot_id}/reorder", response_model=MessageResponse)
def reorder_spotlight(
    spot_id: str,
    sort_order: int = Form(...),
    db: Session = Depends(get_db),
    _admin = Depends(require_admin),
):
    """Update the sort order of a spotlight entry."""
    entry = db.query(Spotlight).filter(Spotlight.id == spot_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Spotlight entry not found")
    entry.sort_order = sort_order
    db.commit()
    return MessageResponse(message="Spotlight order updated")


@router.put("/{spot_id}", response_model=MessageResponse)
def update_spotlight(
    spot_id: str,
    title: str | None = Form(None),
    description: str | None = Form(None),
    is_adult: bool | None = Form(None),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    _admin = Depends(require_admin),
):
    """Update a spotlight entry (admin only). Can update title, description, and/or image."""
    entry = db.query(Spotlight).filter(Spotlight.id == spot_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Spotlight entry not found")
    if title is not None:
        entry.title = title
    if description is not None:
        entry.description = description
    if is_adult is not None:
        entry.is_adult = is_adult
    if file:
        uploads_dir = os.path.abspath(os.path.join(os.getcwd(), 'public', 'uploads', 'spotlight'))
        os.makedirs(uploads_dir, exist_ok=True)
        filename = f"{file.filename}"
        target_path = os.path.join(uploads_dir, filename)
        try:
            with open(target_path, 'wb') as f:
                f.write(file.file.read())
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")
        entry.image_path = f"/uploads/spotlight/{filename}"
    db.commit()
    return MessageResponse(message="Spotlight updated")


@router.delete("/{spot_id}", response_model=MessageResponse)
def delete_spotlight(spot_id: str, db: Session = Depends(get_db), _admin = Depends(require_admin)):
    entry = db.query(Spotlight).filter(Spotlight.id == spot_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Spotlight entry not found")
    db.delete(entry)
    db.commit()
    return MessageResponse(message="Spotlight deleted")
