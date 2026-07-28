"""Calendar router — monthly view of classes and bookings."""

import calendar as cal_module
import csv
from datetime import date
from io import StringIO

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ClassSession, CourtBooking
from app.schemas import BookingOut, CalendarDay, CalendarMonth, ClassOut

router = APIRouter()

DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


def _weekday_to_name(d: date) -> str:
    """Convert a date to our day-of-week string (Sunday-indexed)."""
    return DAYS_FULL[d.weekday() + 1] if d.weekday() != 6 else "Sunday"


@router.get("", response_model=CalendarMonth)
def get_calendar(year: int = 2026, month: int = 6, db: Session = Depends(get_db)):
    """Get calendar events for a given month."""
    days_in_month = cal_module.monthrange(year, month)[1]
    month_str = str(month).zfill(2)
    date_from = f"{year}-{month_str}-01"
    date_to = f"{year}-{month_str}-{str(days_in_month).zfill(2)}"

    # Filter bookings to this month only — avoids full table scan
    month_bookings = (
        db.query(CourtBooking)
        .filter(CourtBooking.date >= date_from, CourtBooking.date <= date_to)
        .filter(CourtBooking.deleted_at.is_(None))
        .all()
    )
    bookings_by_date: dict[str, list[CourtBooking]] = {}
    for b in month_bookings:
        bookings_by_date.setdefault(b.date, []).append(b)

    # Classes are weekly recurring — load active ones only
    all_classes = (
        db.query(ClassSession)
        .filter(
            (ClassSession.end_date == "") | (ClassSession.end_date.is_(None)) |
            (ClassSession.end_date >= date_from)
        )
        .all()
    )
    classes_by_day: dict[str, list[ClassSession]] = {}
    for c in all_classes:
        classes_by_day.setdefault(c.day_of_week, []).append(c)

    days: list[CalendarDay] = []
    for d in range(1, days_in_month + 1):
        date_obj = date(year, month, d)
        date_str = f"{year}-{month_str}-{str(d).zfill(2)}"
        day_name = _weekday_to_name(date_obj)

        day_classes = [
            ClassOut(
                id=c.id, title=c.title, instructor_name=c.instructor_name or "",
                type=c.type, level=c.level, day_of_week=c.day_of_week,
                start_time=c.start_time, end_time=c.end_time,
                max_students=c.max_students if c.max_students else 6,
                min_age=c.min_age if c.min_age is not None else 0,
                max_age=c.max_age if c.max_age is not None else 100,
                current_students=c.current_students,
                price=c.price, description=c.description,
            )
            for c in classes_by_day.get(day_name, [])
        ]

        day_bookings = [
            BookingOut(
                id=b.id, user_id=b.user_id, court_number=b.court_number,
                date=b.date, start_time=b.start_time, end_time=b.end_time,
                status=b.status, contract_type=b.contract_type,
                ball_machine=b.ball_machine, party_size=b.party_size,
                notes=b.notes, created_at=b.created_at,
            )
            for b in bookings_by_date.get(date_str, [])
        ]

        days.append(CalendarDay(day=d, date=date_str, classes=day_classes, bookings=day_bookings))

    return CalendarMonth(year=year, month=month, days=days)


@router.get("/export")
def export_calendar_csv(year: int = 2026, month: int = 6, db: Session = Depends(get_db)):
    """Export the calendar month as CSV containing classes and bookings."""
    cal = get_calendar(year=year, month=month, db=db)
    buf = StringIO()
    writer = csv.writer(buf)
    writer.writerow(["type", "date", "title_or_court", "start_time", "end_time", "level", "details"])
    for day in cal.days:
        for cls in day.classes:
            writer.writerow(["class", day.date, cls.title, cls.start_time, cls.end_time, cls.level, cls.type])
        for b in day.bookings:
            writer.writerow(["booking", day.date, f"Court {b.court_number}", b.start_time, b.end_time, b.user_id, b.notes])

    buf.seek(0)
    return StreamingResponse(buf, media_type="text/csv", headers={
        "Content-Disposition": f"attachment; filename=calendar_{year}_{month}.csv"
    })
