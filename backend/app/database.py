"""SQLAlchemy database setup — single engine + session factory."""

import logging
from sqlalchemy import create_engine, text, inspect
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
    """Create all tables and apply any missing columns (call once on startup).
    
    For new databases, create_all handles everything.
    For existing databases, we check and add missing columns to support
    zero-downtime deployments without requiring manual migration runs.
    """
    import app.models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    
    # Auto-add missing columns for existing databases (safe migration)
    # This allows deploying schema changes without manual Alembic runs
    try:
        with engine.connect() as conn:
            from sqlalchemy import text as sql_text
            inspector = inspect(engine)
            
            # Define columns to add: (table_name, column_name, column_type)
            columns_to_add = [
                ('chat_messages', 'user_id', 'TEXT'),
                ('chat_messages', 'reply_to', 'TEXT'),
                ('court_bookings', 'deleted_at', 'TIMESTAMP'),
                ('payments', 'deleted_at', 'TIMESTAMP'),
                ('payments', 'booking_id', 'TEXT'),
                ('payments', 'enrollment_id', 'TEXT'),
                ('payments', 'confirmed_by', 'TEXT'),
                ('payments', 'confirmed_at', 'TIMESTAMP'),
                ('class_enrollments', 'deleted_at', 'TIMESTAMP'),
                ('schedule_blocks', 'date', 'TEXT'),
            ]
            
            for table_name, column_name, column_type in columns_to_add:
                try:
                    existing_columns = [col['name'] for col in inspector.get_columns(table_name)]
                    if column_name not in existing_columns:
                        conn.execute(sql_text(
                            f'ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}'
                        ))
                        conn.commit()
                        logging.info(f'Added column {table_name}.{column_name}')
                except Exception as e:
                    conn.rollback()
                    logging.warning(f'Could not add column {table_name}.{column_name}: {e}')
            
            # Create indexes if they don't exist
            indexes_to_create = [
                ('ix_bookings_user_id', 'court_bookings', 'user_id'),
                ('ix_payments_user_id', 'payments', 'user_id'),
                ('ix_enrollments_user_id', 'class_enrollments', 'user_id'),
                ('ix_enrollments_class_id', 'class_enrollments', 'class_id'),
                ('ix_assessments_user_id', 'assessments', 'user_id'),
                ('ix_notifications_user_id', 'notifications', 'user_id'),
                ('ix_sub_accounts_parent_id', 'sub_accounts', 'parent_id'),
                ('ix_bookings_date', 'court_bookings', 'date'),
                ('ix_bookings_status', 'court_bookings', 'status'),
                ('ix_payments_status', 'payments', 'status'),
                ('ix_enrollments_status', 'class_enrollments', 'status'),
                ('ix_chat_messages_user_id', 'chat_messages', 'user_id'),
            ]
            
            # Get all existing indexes
            all_existing_indexes = set()
            for tbl in inspector.get_table_names():
                for idx in inspector.get_indexes(tbl):
                    all_existing_indexes.add(idx['name'])
            
            for index_name, table_name, column_name in indexes_to_create:
                if index_name not in all_existing_indexes:
                    try:
                        conn.execute(sql_text(f'CREATE INDEX {index_name} ON {table_name}({column_name})'))
                        conn.commit()
                        logging.info(f'Created index {index_name}')
                    except Exception as e:
                        conn.rollback()
                        logging.warning(f'Could not create index {index_name}: {e}')
    except Exception as e:
        logging.warning(f'Auto-migration failed (non-critical for new databases): {e}')