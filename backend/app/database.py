"""SQLAlchemy database setup — single engine + session factory."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import get_settings

settings = get_settings()

# SQLite needs check_same_thread=False for FastAPI
connect_args = {"check_same_thread": False} if "sqlite" in settings.database_url else {}

# Production-ready connection pool settings for PostgreSQL
engine_kwargs = {"echo": False, "connect_args": connect_args}
if settings.db_engine != "sqlite":
    engine_kwargs.update({
        "pool_size": 10,          # Number of permanent connections
        "max_overflow": 20,       # Additional connections during spikes
        "pool_timeout": 30,       # Seconds to wait for a connection
        "pool_recycle": 3600,     # Recycle connections after 1 hour
        "pool_pre_ping": True,    # Verify connections before use
    })
    # Cloud databases (Neon, Render, etc.) require SSL via connect_args
    if settings.environment == "production":
        engine_kwargs["connect_args"] = {"sslmode": "require"}

engine = create_engine(settings.database_url, **engine_kwargs)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


def get_db():
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables (call once on startup)."""
    # Import all models so they register with Base.metadata
    import app.models  # noqa: F401
    Base.metadata.create_all(bind=engine)