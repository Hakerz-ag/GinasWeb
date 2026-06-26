"""Seasons router — persist current season and 'continue next' flag."""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Season
from app.schemas import SeasonOut, SeasonCreate

router = APIRouter()


@router.get("", response_model=SeasonOut)
def get_season(db: Session = Depends(get_db)):
    """Return the current season (most recent entry)."""
    season = db.query(Season).order_by(Season.created_at.desc()).first()
    if not season:
        # default to Spring
        season = Season(name="Spring", continue_next=False)
        db.add(season)
        db.commit()
        db.refresh(season)
    return SeasonOut(id=season.id, name=season.name, continue_next=season.continue_next, created_at=season.created_at, updated_at=season.updated_at)


@router.post("", response_model=SeasonOut)
def set_season(body: SeasonCreate, db: Session = Depends(get_db)):
    """Set a new season entry. Keeps history of changes."""
    season = Season(name=body.name, continue_next=body.continue_next)
    db.add(season)
    db.commit()
    db.refresh(season)
    return SeasonOut(id=season.id, name=season.name, continue_next=season.continue_next, created_at=season.created_at, updated_at=season.updated_at)
