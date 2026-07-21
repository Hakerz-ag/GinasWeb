"""Contract Schedule API — admin-managed class time slots for Fall/Spring programs."""

from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import ContractScheduleDay, ContractScheduleSlot, User
from app.schemas import (
    ContractScheduleDayOut,
    ContractScheduleDayCreate,
    ContractScheduleDayUpdate,
    ContractScheduleSlotCreate,
    ContractScheduleSlotUpdate,
    MessageResponse,
)
from app.services.auth_middleware import require_admin, get_current_user
from app.services.email_service import send_contract_time_email

router = APIRouter(prefix="/contract-schedule", tags=["contract-schedule"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Public: Get full schedule ────────────────────────────────────────────────

@router.get("", response_model=List[ContractScheduleDayOut])
def get_contract_schedule(db: Session = Depends(get_db)):
    """Get the full contract schedule (public — shown on the booking page)."""
    days = (
        db.query(ContractScheduleDay)
        .order_by(ContractScheduleDay.sort_order, ContractScheduleDay.day)
        .all()
    )
    return days


# ── Admin: Create a new schedule day with slots ─────────────────────────────

@router.post("", response_model=ContractScheduleDayOut)
def create_schedule_day(data: ContractScheduleDayCreate, db: Session = Depends(get_db), _: dict = Depends(require_admin)):
    day = ContractScheduleDay(
        day=data.day,
        category=data.category,
        dates=data.dates,
        off=data.off,
        classes=data.classes,
        sort_order=data.sort_order,
    )
    db.add(day)
    db.flush()  # get the id

    for slot_data in data.slots:
        slot = ContractScheduleSlot(
            day_id=day.id,
            time=slot_data.time,
            level=slot_data.level,
            play=slot_data.play,
            ages=slot_data.ages,
            rate=slot_data.rate,
            sort_order=slot_data.sort_order,
        )
        db.add(slot)

    db.commit()
    db.refresh(day)
    return day


# ── Admin: Update a schedule day ────────────────────────────────────────────

@router.put("/{day_id}", response_model=ContractScheduleDayOut)
def update_schedule_day(day_id: str, data: ContractScheduleDayUpdate, db: Session = Depends(get_db), _: dict = Depends(require_admin)):
    day = db.query(ContractScheduleDay).filter(ContractScheduleDay.id == day_id).first()
    if not day:
        raise HTTPException(status_code=404, detail="Schedule day not found")

    if data.day is not None:
        day.day = data.day
    if data.category is not None:
        day.category = data.category
    if data.dates is not None:
        day.dates = data.dates
    if data.off is not None:
        day.off = data.off
    if data.classes is not None:
        day.classes = data.classes
    if data.sort_order is not None:
        day.sort_order = data.sort_order

    db.commit()
    db.refresh(day)
    return day


# ── Admin: Delete a schedule day (and its slots) ────────────────────────────

@router.delete("/{day_id}", response_model=MessageResponse)
def delete_schedule_day(day_id: str, db: Session = Depends(get_db), _: dict = Depends(require_admin)):
    day = db.query(ContractScheduleDay).filter(ContractScheduleDay.id == day_id).first()
    if not day:
        raise HTTPException(status_code=404, detail="Schedule day not found")

    db.delete(day)
    db.commit()
    return MessageResponse(message=f"Schedule day '{day.day} ({day.category})' deleted")


# ── Admin: Add a slot to a day ──────────────────────────────────────────────

@router.post("/{day_id}/slots", response_model=ContractScheduleDayOut)
def add_slot_to_day(day_id: str, slot_data: ContractScheduleSlotCreate, db: Session = Depends(get_db), _: dict = Depends(require_admin)):
    day = db.query(ContractScheduleDay).filter(ContractScheduleDay.id == day_id).first()
    if not day:
        raise HTTPException(status_code=404, detail="Schedule day not found")

    slot = ContractScheduleSlot(
        day_id=day_id,
        time=slot_data.time,
        level=slot_data.level,
        play=slot_data.play,
        ages=slot_data.ages,
        rate=slot_data.rate,
        sort_order=slot_data.sort_order,
    )
    db.add(slot)
    db.commit()
    db.refresh(day)
    return day


# ── Admin: Update a slot ────────────────────────────────────────────────────

@router.put("/slots/{slot_id}", response_model=ContractScheduleDayOut)
def update_slot(slot_id: str, data: ContractScheduleSlotUpdate, db: Session = Depends(get_db), _: dict = Depends(require_admin)):
    slot = db.query(ContractScheduleSlot).filter(ContractScheduleSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    if data.time is not None:
        slot.time = data.time
    if data.level is not None:
        slot.level = data.level
    if data.play is not None:
        slot.play = data.play
    if data.ages is not None:
        slot.ages = data.ages
    if data.rate is not None:
        slot.rate = data.rate
    if data.sort_order is not None:
        slot.sort_order = data.sort_order

    db.commit()
    # Return the parent day with all slots
    day = db.query(ContractScheduleDay).filter(ContractScheduleDay.id == slot.day_id).first()
    db.refresh(day)
    return day


# ── Admin: Delete a slot ────────────────────────────────────────────────────

@router.delete("/slots/{slot_id}", response_model=MessageResponse)
def delete_slot(slot_id: str, db: Session = Depends(get_db), _: dict = Depends(require_admin)):
    slot = db.query(ContractScheduleSlot).filter(ContractScheduleSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    db.delete(slot)
    db.commit()
    return MessageResponse(message="Slot deleted")


# ── Admin: Seed the contract schedule with default Fall 2026 data ───────────

@router.post("/seed", response_model=MessageResponse)
def seed_contract_schedule(db: Session = Depends(get_db), _: dict = Depends(require_admin)):
    """Seed the contract schedule with Fall 2026 data if empty."""
    existing = db.query(ContractScheduleDay).first()
    if existing:
        raise HTTPException(status_code=400, detail="Contract schedule already has data. Delete existing entries first.")

    FALL_2026 = [
        # ── ADULT PROGRAMS ──
        {"day": "Monday", "category": "Adult", "dates": "Sept 14 – Dec 21", "off": "Sept 21 & Nov 23", "classes": 13, "sort_order": 0, "slots": [
            {"time": "9:00 – 10:00 AM", "level": "Beg./Adv.Beg.", "play": "No", "ages": "", "rate": "$570"},
            {"time": "11:30 AM – 1:00 PM", "level": "Intermediate", "play": "1/2 hr", "ages": "", "rate": "$660"},
            {"time": "1:00 – 2:30 PM", "level": "Intermediate", "play": "1/2 hr", "ages": "", "rate": "$660"},
            {"time": "6:00 – 7:30 PM", "level": "Intermediate", "play": "1/2 hr", "ages": "", "rate": "$660"},
        ]},
        {"day": "Tuesday", "category": "Adult", "dates": "Sept 15 – Dec 15", "off": "Nov 24", "classes": 13, "sort_order": 1, "slots": [
            {"time": "12:00 – 1:00 PM", "level": "Beginner", "play": "No", "ages": "", "rate": "$570"},
            {"time": "1:00 – 2:30 PM", "level": "Int./Adv.", "play": "1/2 hr", "ages": "", "rate": "$660"},
            {"time": "6:00 – 7:00 PM", "level": "Beginner", "play": "No", "ages": "", "rate": "$570"},
            {"time": "6:00 – 7:00 PM", "level": "Intermediate", "play": "No", "ages": "", "rate": "$570"},
        ]},
        {"day": "Thursday", "category": "Adult", "dates": "Sept 17 – Dec 17", "off": "Nov 5 & 26", "classes": 12, "sort_order": 2, "slots": [
            {"time": "12:00 – 1:00 PM", "level": "Intermediate", "play": "No", "ages": "", "rate": "$530"},
            {"time": "1:00 – 2:30 PM", "level": "Adv.Beg./Int.", "play": "1/2 hr", "ages": "", "rate": "$620"},
            {"time": "6:00 – 7:00 PM", "level": "Adv.Beg./Int.", "play": "No", "ages": "", "rate": "$530"},
        ]},
        {"day": "Friday", "category": "Adult", "dates": "Sept 18 – Dec 18", "off": "Nov 6 & 27", "classes": 12, "sort_order": 3, "slots": [
            {"time": "12:00 – 1:00 PM", "level": "Beginner", "play": "No", "ages": "", "rate": "$530"},
            {"time": "1:00 – 2:30 PM", "level": "Intermediate", "play": "1/2 hr", "ages": "", "rate": "$620"},
            {"time": "6:30 – 8:00 PM", "level": "Int./Adv.", "play": "1/2 hr", "ages": "", "rate": "$620"},
        ]},
        {"day": "Saturday", "category": "Adult", "dates": "Sept 19 – Dec 19", "off": "Nov 28", "classes": 13, "sort_order": 4, "slots": [
            {"time": "10:30 – 11:30 AM", "level": "Beg./Adv.Beg.", "play": "No", "ages": "", "rate": "$570"},
            {"time": "11:30 AM – 12:30 PM", "level": "Adv. Beginner", "play": "No", "ages": "", "rate": "$570"},
            {"time": "1:30 – 2:30 PM", "level": "Beginner", "play": "No", "ages": "", "rate": "$570"},
            {"time": "2:30 – 4:00 PM", "level": "Advanced", "play": "1/2 hr", "ages": "", "rate": "$660"},
        ]},
        {"day": "Sunday", "category": "Adult", "dates": "Sept 20 – Dec 20", "off": "Nov 29", "classes": 13, "sort_order": 5, "slots": [
            {"time": "10:30 – 11:30 AM", "level": "Adv. Beginner", "play": "No", "ages": "", "rate": "$570"},
            {"time": "12:30 – 1:30 PM", "level": "Beg./Adv.Beg.", "play": "No", "ages": "", "rate": "$570"},
            {"time": "1:30 – 2:30 PM", "level": "Intermediate", "play": "No", "ages": "", "rate": "$570"},
            {"time": "4:00 – 5:00 PM", "level": "Intermediate", "play": "No", "ages": "", "rate": "$570"},
            {"time": "4:00 – 5:00 PM", "level": "Beg./Adv.Beg.", "play": "No", "ages": "", "rate": "$570"},
            {"time": "5:00 – 6:30 PM", "level": "Advanced", "play": "1/2 hr", "ages": "", "rate": "$660"},
        ]},
        # ── JUNIOR PROGRAMS ──
        {"day": "Monday", "category": "Junior", "dates": "Sept 14 – Dec 21", "off": "Sept 21 & Nov 23", "classes": 13, "sort_order": 6, "slots": [
            {"time": "4:00 – 5:00 PM", "level": "Beg./Adv.Beg.", "play": "No", "ages": "7–12", "rate": "$520"},
            {"time": "5:00 – 6:00 PM", "level": "Intermediate", "play": "No", "ages": "11–16", "rate": "$520"},
            {"time": "5:00 – 6:00 PM", "level": "Advanced", "play": "No", "ages": "12–17", "rate": "$520"},
        ]},
        {"day": "Tuesday", "category": "Junior", "dates": "Sept 15 – Dec 15", "off": "Nov 24", "classes": 13, "sort_order": 7, "slots": [
            {"time": "4:00 – 5:00 PM", "level": "Beginner", "play": "No", "ages": "8–12", "rate": "$520"},
            {"time": "4:00 – 5:00 PM", "level": "Adv. Beginner", "play": "No", "ages": "9–13", "rate": "$520"},
            {"time": "5:00 – 6:00 PM", "level": "Intermediate", "play": "No", "ages": "10–15", "rate": "$520"},
            {"time": "5:00 – 6:00 PM", "level": "Advanced", "play": "No", "ages": "12–17", "rate": "$520"},
        ]},
        {"day": "Thursday", "category": "Junior", "dates": "Sept 17 – Dec 17", "off": "Nov 5 & 26", "classes": 12, "sort_order": 8, "slots": [
            {"time": "4:00 – 5:00 PM", "level": "Beginner", "play": "No", "ages": "5–8", "rate": "$480"},
            {"time": "4:00 – 5:00 PM", "level": "Adv. Beginner", "play": "No", "ages": "9–14", "rate": "$480"},
            {"time": "5:00 – 6:00 PM", "level": "Older Beginner", "play": "No", "ages": "10–15", "rate": "$480"},
            {"time": "5:00 – 6:00 PM", "level": "Intermediate", "play": "No", "ages": "11–15", "rate": "$480"},
        ]},
        {"day": "Friday", "category": "Junior", "dates": "Sept 18 – Dec 18", "off": "Nov 6 & 27", "classes": 12, "sort_order": 9, "slots": [
            {"time": "3:30 – 4:30 PM", "level": "Beginner", "play": "No", "ages": "8–12", "rate": "$480"},
            {"time": "3:30 – 4:30 PM", "level": "Adv. Beginner", "play": "No", "ages": "9–13", "rate": "$480"},
            {"time": "4:30 – 5:30 PM", "level": "Beg./Adv.Beg.", "play": "No", "ages": "10–16", "rate": "$480"},
            {"time": "4:30 – 5:30 PM", "level": "Intermediate", "play": "No", "ages": "11–16", "rate": "$480"},
            {"time": "5:30 – 6:30 PM", "level": "Int./Advanced", "play": "No", "ages": "13–18", "rate": "$480"},
        ]},
        {"day": "Saturday", "category": "Junior", "dates": "Sept 19 – Dec 19", "off": "Nov 28", "classes": 13, "sort_order": 10, "slots": [
            {"time": "10:30 – 11:30 AM", "level": "Beg./Adv.Beg.", "play": "No", "ages": "7–11", "rate": "$520"},
            {"time": "11:30 AM – 12:30 PM", "level": "Adv.Beg./Int.", "play": "No", "ages": "11–16", "rate": "$520"},
            {"time": "12:30 – 1:30 PM", "level": "Older Beginner", "play": "No", "ages": "11–16", "rate": "$520"},
            {"time": "12:30 – 1:30 PM", "level": "Intermediate", "play": "No", "ages": "13–17", "rate": "$520"},
            {"time": "1:30 – 2:30 PM", "level": "Beginner", "play": "No", "ages": "5–9", "rate": "$520"},
            {"time": "2:30 – 4:00 PM", "level": "Advanced", "play": "No", "ages": "14–18", "rate": "$780"},
        ]},
        {"day": "Sunday", "category": "Junior", "dates": "Sept 20 – Dec 20", "off": "Nov 29", "classes": 13, "sort_order": 11, "slots": [
            {"time": "10:30 – 11:30 AM", "level": "Beginner", "play": "No", "ages": "5–9", "rate": "$520"},
            {"time": "11:30 AM – 12:30 PM", "level": "Adv.Beg./Int.", "play": "No", "ages": "10–14", "rate": "$520"},
            {"time": "12:30 – 1:30 PM", "level": "Adv. Beg.", "play": "No", "ages": "6–9", "rate": "$520"},
            {"time": "1:30 – 2:30 PM", "level": "Beginner", "play": "No", "ages": "8–12", "rate": "$520"},
            {"time": "2:30 – 4:00 PM", "level": "Intermediate", "play": "No", "ages": "14–18", "rate": "$780"},
            {"time": "2:30 – 4:00 PM", "level": "Advanced", "play": "No", "ages": "14–18", "rate": "$780"},
        ]},
    ]

    for day_data in FALL_2026:
        slots_data = day_data.pop("slots")
        day = ContractScheduleDay(**day_data)
        db.add(day)
        db.flush()

        for i, slot_data in enumerate(slots_data):
            slot = ContractScheduleSlot(day_id=day.id, sort_order=i, **slot_data)
            db.add(slot)

    db.commit()
    return MessageResponse(message=f"Seeded {len(FALL_2026)} schedule days with Fall 2026 data")


# ── Public: Select a contract time (sends confirmation email) ────────────────

class ContractTimeSelection(BaseModel):
    """Request body when a user selects a contract time slot."""
    slot_id: Optional[str] = None  # ID of the slot (if from DB)
    day: str = ""                   # e.g. "Monday"
    category: str = ""              # "Adult" or "Junior"
    time: str = ""                  # e.g. "9:00 – 10:00 AM"
    level: str = ""                 # e.g. "Beginner"
    rate: str = ""                  # e.g. "$570"
    dates: str = ""                 # e.g. "Sept 14 – Dec 21"
    ages: str = ""                  # e.g. "7–12"
    play: str = ""                  # e.g. "1/2 hr" or "No"
    classes: int = 0                # number of classes


@router.post("/select", response_model=MessageResponse)
def select_contract_time(
    data: ContractTimeSelection,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """When a user selects a contract time, send them and Gina a confirmation email."""
    # If slot_id is provided, look up the slot details from the DB
    if data.slot_id:
        slot = db.query(ContractScheduleSlot).filter(ContractScheduleSlot.id == data.slot_id).first()
        if slot:
            day_entry = db.query(ContractScheduleDay).filter(ContractScheduleDay.id == slot.day_id).first()
            if day_entry:
                data.day = data.day or day_entry.day
                data.category = data.category or day_entry.category
                data.dates = data.dates or day_entry.dates
                data.classes = data.classes or day_entry.classes
                data.time = data.time or slot.time
                data.level = data.level or slot.level
                data.rate = data.rate or slot.rate
                data.ages = data.ages or slot.ages
                data.play = data.play or slot.play

    # Send confirmation email
    send_contract_time_email(
        to_email=user.email,
        name=user.name,
        contract_day=data.day,
        contract_category=data.category,
        contract_time=data.time,
        contract_level=data.level,
        contract_rate=data.rate,
        contract_dates=data.dates,
        contract_ages=data.ages,
        contract_play=data.play,
        contract_classes=data.classes,
    )

    return MessageResponse(message=f"Contract time selection confirmed for {data.day} {data.time} ({data.category})")