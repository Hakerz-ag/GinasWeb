"""Seed the database with initial data so the app works out of the box."""

from datetime import datetime
from sqlalchemy.orm import Session

from app.models import User, SubAccount, ClassSession, CourtBooking, OpenTime
from app.services.auth import hash_password


def seed_db(db: Session):
    """Insert demo data only if the tables are empty."""

    # ── Only seed if empty ────────────────────────────────────────────────
    if db.query(User).first():
        return

    # ── Users ────────────────────────────────────────────────────────────
    admin = User(
        id="admin-1",
        email="gina@ginastennisworld.com",
        password_hash=hash_password("admin123"),
        name="Gina",
        role="admin",
        phone="(908) 464-9591",
        skill_level="advanced",
        assessment_completed=True,
        status="active",
        created_at=datetime(2023, 1, 1),
    )
    db.add(admin)

    customer = User(
        id="cust-1",
        email="john@example.com",
        password_hash=hash_password("customer123"),
        name="John Smith",
        role="customer",
        phone="(908) 555-0123",
        birth_date="1985-03-15",
        skill_level="intermediate",
        assessment_completed=True,
        sessions_taken=12,
        status="active",
        created_at=datetime(2025, 9, 15),
    )
    db.add(customer)
    db.flush()  # get IDs

    db.add(SubAccount(id="sub-1", parent_id=customer.id, name="Emma Smith", birth_date="2014-06-20", phone="", email="", relationship_type="child", skill_level="beginner", assessment_completed=True, sessions_taken=8))
    db.add(SubAccount(id="sub-2", parent_id=customer.id, name="Jack Smith", birth_date="2017-09-10", phone="", email="", relationship_type="child", skill_level="none", assessment_completed=False, sessions_taken=0))

    # More customers
    db.add(User(id="cust-2", email="maria@example.com", password_hash=hash_password("customer123"), name="Maria Garcia", role="customer", phone="(908) 555-0345", birth_date="1990-07-22", skill_level="beginner", assessment_completed=True, sessions_taken=6, status="active", created_at=datetime(2025, 10, 1)))
    db.add(User(id="cust-3", email="david@example.com", password_hash=hash_password("customer123"), name="David Chen", role="customer", phone="(908) 555-0567", birth_date="1978-11-03", skill_level="none", assessment_completed=False, sessions_taken=0, status="pending", created_at=datetime(2026, 5, 1)))
    db.add(User(id="cust-4", email="lisa@example.com", password_hash=hash_password("customer123"), name="Lisa Johnson", role="customer", phone="(908) 555-0890", birth_date="1992-01-18", skill_level="advanced", assessment_completed=True, sessions_taken=20, status="active", created_at=datetime(2025, 11, 1)))
    db.add(User(id="cust-5", email="robert@example.com", password_hash=hash_password("customer123"), name="Robert Kim", role="customer", phone="(908) 555-1234", birth_date="2005-04-28", skill_level="intermediate", assessment_completed=True, sessions_taken=10, status="active", created_at=datetime(2025, 12, 1)))
    db.add(User(id="cust-6", email="emily@example.com", password_hash=hash_password("customer123"), name="Emily Davis", role="customer", phone="(908) 555-5678", birth_date="1988-08-14", skill_level="beginner", assessment_completed=True, sessions_taken=4, status="active", created_at=datetime(2026, 1, 1)))

    # ── Classes ──────────────────────────────────────────────────────────
    classes_data = [
        ClassSession(id="cls-1", title="Junior Beginners Clinic", instructor_name="Wendy", type="junior-clinic", level="beginner", day_of_week="Monday", start_time="4:00 PM", end_time="5:30 PM", start_date="2026-04-01", end_date="2026-12-15", max_students=8, current_students=6, price=35, description="A fun introduction to tennis for kids ages 6-12. Learn basic strokes, footwork, and court positioning."),
        ClassSession(id="cls-2", title="Adult Intermediate Clinic", instructor_name="Wendy", type="adult-clinic", level="intermediate", day_of_week="Tuesday", start_time="7:00 PM", end_time="8:30 PM", start_date="2026-04-01", end_date="2026-12-15", max_students=6, current_students=4, price=45, description="For players who can rally consistently. Focus on strategy, point construction, and shot selection."),
        ClassSession(id="cls-4", title="Junior Advanced Clinic", instructor_name="Phil", type="junior-clinic", level="advanced", day_of_week="Thursday", start_time="5:00 PM", end_time="6:30 PM", start_date="2026-04-01", end_date="2026-12-15", max_students=6, current_students=5, price=40, description="Competitive juniors ready for tournament play. Advanced drills, match strategy, and mental toughness."),
        ClassSession(id="cls-5", title="Adult Beginners Clinic", instructor_name="Wendy", type="adult-clinic", level="beginner", day_of_week="Saturday", start_time="10:00 AM", end_time="11:30 AM", start_date="2026-04-01", end_date="2026-12-15", max_students=8, current_students=3, price=35, description="Never held a racquet? No problem! Learn the fundamentals in a supportive, no-pressure environment."),
        ClassSession(id="cls-6", title="Junior Ball Machine Clinic", instructor_name="Phil", type="junior-clinic", level="all", day_of_week="Friday", start_time="4:00 PM", end_time="5:00 PM", start_date="2026-04-01", end_date="2026-12-15", max_students=4, current_students=2, price=30, description="Groove your strokes with our ball machine. Repetition builds muscle memory and consistency for juniors."),
        ClassSession(id="cls-7", title="Adult Power & Conditioning", instructor_name="Phil", type="adult-clinic", level="advanced", day_of_week="Wednesday", start_time="6:00 PM", end_time="7:30 PM", start_date="2026-04-01", end_date="2026-12-15", max_students=6, current_students=4, price=50, description="High-intensity clinic for advanced adults. Power drills, conditioning, and competitive match play."),
    ]
    db.add_all(classes_data)

    # ── Bookings ─────────────────────────────────────────────────────────
    bookings_data = [
        CourtBooking(id="bk-1", user_id="cust-1", court_number=1, date="2026-06-05", start_time="6:00 PM", end_time="7:30 PM", status="approved", contract_type="30-week", ball_machine=False, party_size=4, notes="Birthday party for Emma", created_at=datetime(2026, 5, 20)),
        CourtBooking(id="bk-2", user_id="cust-2", court_number=2, date="2026-06-07", start_time="10:00 AM", end_time="12:00 PM", status="pending", contract_type="open-single", ball_machine=False, party_size=2, notes="Doubles practice", created_at=datetime(2026, 5, 22)),
        CourtBooking(id="bk-3", user_id="cust-3", court_number=1, date="2026-06-10", start_time="4:00 PM", end_time="5:30 PM", status="pending", contract_type="15-week", ball_machine=True, party_size=6, notes="Corporate team building event", created_at=datetime(2026, 5, 25)),
    ]
    db.add_all(bookings_data)

    # ── Open Times ───────────────────────────────────────────────────────
    open_times_data = [
        OpenTime(id="ot-1", day="Monday", time="7:00 PM", court="1", status="available"),
        OpenTime(id="ot-2", day="Wednesday", time="5:00 PM", court="2", status="available"),
        OpenTime(id="ot-3", day="Friday", time="8:00 PM", court="1", status="booked"),
    ]
    db.add_all(open_times_data)

    db.commit()
    print("✅ Database seeded with demo data.")