"""Calendar router — monthly view of classes and bookings."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ClassSession, CourtBooking
from app.schemas import CalendarMonth, CalendarDay, ClassOut, BookingOut
from fastapi.responses import StreamingResponse
import csv
from io import StringIO

router = APIRouter()

DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


@router.get("", response_model=CalendarMonth)
def get_calendar(year: int = 2026, month: int = 6, db: Session = Depends(get_db)):
    """Get calendar events for a given month."""
    days_in_month = 31  # simplified — real months vary

    # Pre-load all classes and bookings
    all_classes = db.query(ClassSession).all()
    all_bookings = db.query(CourtBooking).all()

    import calendar as cal_module
    days_in_month = cal_module.monthrange(year, month)[1]

    days: list[CalendarDay] = []
    for d in range(1, days_in_month + 1):
        date_obj = __import__("datetime").date(year, month, d)
        day_name = DAYS_FULL[date_obj.weekday() + 1] if date_obj.weekday() < 6 else DAYS_FULL[0]
        # Fix: weekday() returns 0=Mon..6=Sun, but our data uses full names
        day_name = DAYS_FULL[date_obj.weekday() + 1] if date_obj.weekday() != 6 else "Sunday"
        date_str = f"{year}-{str(month).zfill(2)}-{str(d).zfill(2)}"

        day_classes = [ClassOut(
            id=c.id, title=c.title, instructor_name=c.instructor_name,
            type=c.type, level=c.level, day_of_week=c.day_of_week,
            start_time=c.start_time, end_time=c.end_time,
            max_students=c.max_students, current_students=c.current_students,
            price=c.price, description=c.description,
        ) for c in all_classes if c.day_of_week == day_name]

        day_bookings = [BookingOut(
            id=b.id, user_id=b.user_id, court_number=b.court_number,
            date=b.date, start_time=b.start_time, end_time=b.end_time,
            status=b.status, contract_type=b.contract_type,
            ball_machine=b.ball_machine, party_size=b.party_size,
            notes=b.notes, created_at=b.created_at,
        ) for b in all_bookings if b.date == date_str]

        days.append(CalendarDay(day=d, date=date_str, classes=day_classes, bookings=day_bookings))

    return CalendarMonth(year=year, month=month, days=days)


@router.get("/export")
def export_calendar_csv(year: int = 2026, month: int = 6, db: Session = Depends(get_db)):
    """Export the calendar month as CSV containing classes and bookings."""
    cal = get_calendar(year=year, month=month, db=db)
    buf = StringIO()
    writer = csv.writer(buf)
    writer.writerow(["type", "date", "title_or_court", "start_time", "end_time", "instructor_or_user", "details"])
    for day in cal.days:
        for cls in day.classes:
            writer.writerow(["class", day.date, cls.title, cls.start_time, cls.end_time, cls.instructor_name, cls.level])
        for b in day.bookings:
            writer.writerow(["booking", day.date, f"Court {b.court_number}", b.start_time, b.end_time, b.user_id, b.notes])

    buf.seek(0)
    return StreamingResponse(buf, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=calendar_{year}_{month}.csv"})