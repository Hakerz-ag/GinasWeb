"""FastAPI application entry point — Gina's Tennis World API."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import SessionLocal, init_db
from app.services.seed import seed_db
from app.routers import auth, users, bookings, classes, calendar, email, opentimes, assessments, scheduleblocks, chatmessages
from app.routers import notifications, payments, dashboard, realtime

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup: create tables and seed demo data."""
    print("🚀 Starting Gina's Tennis World API...")
    init_db()
    db = SessionLocal()
    try:
        seed_db(db)
    finally:
        db.close()
    yield
    print("👋 Shutting down...")


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "app": settings.app_name}


# ── Register routers ────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(bookings.router, prefix="/bookings", tags=["Bookings"])
app.include_router(classes.router, prefix="/classes", tags=["Classes"])
app.include_router(calendar.router, prefix="/calendar", tags=["Calendar"])
app.include_router(email.router, prefix="/email", tags=["Email"])
app.include_router(opentimes.router, prefix="/opentimes", tags=["Open Times"])
app.include_router(assessments.router, prefix="/assessments", tags=["Assessments"])
app.include_router(scheduleblocks.router, prefix="/schedule-blocks", tags=["Schedule Blocks"])
app.include_router(chatmessages.router, prefix="/chat-messages", tags=["Chat Messages"])
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
app.include_router(payments.router, prefix="/payments", tags=["Payments"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(realtime.router, tags=["Realtime"])