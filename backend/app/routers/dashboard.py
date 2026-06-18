"""Dashboard router — admin stats and overview data."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import User, CourtBooking, ClassEnrollment, ClassSession, ChatMessage, Payment, Notification
from app.schemas import DashboardStats

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get admin dashboard statistics."""
    total_customers = db.query(User).filter(User.role == "customer").count()
    active_customers = db.query(User).filter(User.role == "customer", User.status == "active").count()
    pending_customers = db.query(User).filter(User.role == "customer", User.status == "pending").count()
    total_bookings = db.query(CourtBooking).count()
    pending_bookings = db.query(CourtBooking).filter(CourtBooking.status == "pending").count()
    total_enrollments = db.query(ClassEnrollment).count()
    active_classes = db.query(ClassSession).count()
    total_revenue = db.query(func.sum(Payment.amount)).filter(Payment.status == "completed").scalar() or 0
    unread_messages = db.query(ChatMessage).filter(ChatMessage.read == False).count()  # noqa: E712
    
    # Recent signups (last 30 days)
    from datetime import datetime, timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_signups = db.query(User).filter(User.created_at >= thirty_days_ago).count()

    return DashboardStats(
        total_customers=total_customers,
        active_customers=active_customers,
        pending_customers=pending_customers,
        total_bookings=total_bookings,
        pending_bookings=pending_bookings,
        total_enrollments=total_enrollments,
        active_classes=active_classes,
        total_revenue=float(total_revenue),
        unread_messages=unread_messages,
        recent_signups=recent_signups,
    )