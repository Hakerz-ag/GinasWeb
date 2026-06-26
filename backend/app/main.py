"""FastAPI application entry point — Gina's Tennis World API."""

import os
import json as _json
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import get_settings
from app.database import SessionLocal, init_db
from app.services.seed import seed_db
from app.routers import auth, users, bookings, classes, calendar, email, opentimes, assessments, scheduleblocks, chatmessages
from app.routers import notifications, payments, dashboard, realtime, contact, mfa

settings = get_settings()

# ── Sentry error tracking ──────────────────────────────────────────────────
if os.getenv("SENTRY_DSN"):
    import sentry_sdk
    sentry_sdk.init(
        dsn=os.getenv("SENTRY_DSN"),
        environment=settings.environment,
        traces_sample_rate=0.1,
    )

# ── Structured JSON logging ─────────────────────────────────────────────────
class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "timestamp": self.formatTime(record),
        }
        if record.exc_info and record.exc_info[0]:
            log_entry["exception"] = self.formatException(record.exc_info)
        return _json.dumps(log_entry)

_handler = logging.StreamHandler()
_handler.setFormatter(JSONFormatter())
logging.getLogger().addHandler(_handler)
logging.getLogger().setLevel(logging.INFO)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

# ── Rate limiter ────────────────────────────────────────────────────────────
def _get_real_ip(request: Request) -> str:
    """Get the real client IP from X-Forwarded-For header (behind reverse proxy).
    
    Render, Vercel, and other cloud providers put the real client IP in
    X-Forwarded-For. Fall back to request.client.host if not available.
    """
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # X-Forwarded-For can be a comma-separated list; the first is the real client
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

limiter = Limiter(key_func=_get_real_ip)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup: create tables and seed demo data."""
    logging.info("Starting Gina's Tennis World API...")
    init_db()
    db = SessionLocal()
    try:
        seed_db(db)
    finally:
        db.close()
    yield
    logging.info("Shutting down...")


# ── Disable OpenAPI docs in production ──────────────────────────────────────
app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.environment == "development" else None,
    redoc_url="/redoc" if settings.environment == "development" else None,
    openapi_url="/openapi.json" if settings.environment == "development" else None,
)

# ── Rate limit error handler ────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Security headers middleware ──────────────────────────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# ── CORS — restrict to known origins (never wildcard with credentials) ──────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
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
app.include_router(__import__('app.routers.payment_plans', fromlist=['router']).router, prefix="/payment-plans", tags=["Payment Plans"])
app.include_router(__import__('app.routers.seasons', fromlist=['router']).router, prefix="/seasons", tags=["Seasons"])
app.include_router(contact.router, prefix="/contact", tags=["Contact"])
app.include_router(mfa.router, prefix="/auth/mfa", tags=["MFA"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(realtime.router, tags=["Realtime"])