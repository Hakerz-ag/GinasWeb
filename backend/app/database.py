"""SQLAlchemy database setup — single engine + session factory."""

import logging
import time
from sqlalchemy import create_engine, text, inspect, event
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

# ── Slow query logging ─────────────────────────────────────────────────────
# Log any SQL query that takes longer than 500ms
SLOW_QUERY_THRESHOLD_MS = 500

@event.listens_for(engine, "before_cursor_execute")
def _before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    context._query_start_time = time.time()

@event.listens_for(engine, "after_cursor_execute")
def _after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    total_time = (time.time() - context._query_start_time) * 1000  # ms
    if total_time > SLOW_QUERY_THRESHOLD_MS:
        logging.warning(
            f"Slow query ({total_time:.0f}ms): {statement[:200]}..."
            if len(statement) > 200
            else f"Slow query ({total_time:.0f}ms): {statement}"
        )
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
                ('class_enrollments', 'sub_account_id', 'TEXT REFERENCES sub_accounts(id)'),
                ('class_sessions', 'season', 'TEXT'),
                ('schedule_blocks', 'date', 'TEXT'),
                ('open_times', 'start_time', 'TEXT'),
                ('open_times', 'end_time', 'TEXT'),
                ('users', 'totp_secret', 'TEXT'),
                ('users', 'totp_enabled', 'BOOLEAN DEFAULT 0'),
                ('class_sessions', 'min_age', 'INTEGER DEFAULT 0'),
                ('class_sessions', 'max_age', 'INTEGER DEFAULT 100'),
                ('spotlight', 'user_id', 'TEXT'),
                ('spotlight', 'title', 'TEXT'),
                ('spotlight', 'description', 'TEXT'),
                ('spotlight', 'image_path', 'TEXT'),
                ('spotlight', 'is_adult', 'BOOLEAN DEFAULT 1'),
                ('spotlight', 'created_at', 'TIMESTAMP'),
                ('class_sessions', 'min_age', 'INTEGER DEFAULT 0'),
                ('class_sessions', 'max_age', 'INTEGER DEFAULT 100'),
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
            
            # Migrate legacy open_times.time → start_time/end_time
            try:
                ot_columns = [col['name'] for col in inspector.get_columns('open_times')]
                if 'time' in ot_columns and 'start_time' in ot_columns:
                    conn.execute(sql_text(
                        "UPDATE open_times SET start_time = time, end_time = '10:00 AM' "
                        "WHERE (start_time IS NULL OR start_time = '') AND time IS NOT NULL AND time != ''"
                    ))
                    conn.commit()
                    logging.info('Migrated open_times.time → start_time/end_time')
            except Exception as e:
                conn.rollback()
                logging.warning(f'Could not migrate open_times: {e}')

            # Make instructor_name nullable on class_sessions (was NOT NULL, now optional)
            try:
                class_columns = [col['name'] for col in inspector.get_columns('class_sessions')]
                if 'instructor_name' in class_columns:
                    conn.execute(sql_text(
                        'ALTER TABLE class_sessions ALTER COLUMN instructor_name DROP NOT NULL'
                    ))
                    conn.commit()
                    logging.info('Made class_sessions.instructor_name nullable')
            except Exception as e:
                conn.rollback()
                logging.warning(f'Could not make instructor_name nullable: {e}')

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
                ('ix_users_email', 'users', 'email'),
                ('ix_class_sessions_day', 'class_sessions', 'day_of_week'),
                ('ix_class_sessions_start_date', 'class_sessions', 'start_date'),
                ('ix_payments_created_at', 'payments', 'created_at'),
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


def encrypt_birth_dates() -> None:
    """Encrypt any plaintext birth_date values in users and sub_accounts.

    Called at startup after init_db(). Idempotent — already-encrypted values
    (Fernet tokens starting with 'gAAAAA') are skipped. No-op if ENCRYPTION_KEY
    is not set (plaintext dev mode), but logs a critical warning in production.
    """
    from app.config import get_settings
    from app.services.encryption import encrypt, is_encrypted

    cfg = get_settings()
    if not cfg.encryption_key:
        if cfg.is_production:
            logging.critical(
                "ENCRYPTION_KEY not set in production — birth_date PII stored as plaintext. "
                "Generate a key and set it in Render dashboard immediately."
            )
        return

    try:
        with engine.connect() as conn:
            for table in ("users", "sub_accounts"):
                rows = conn.execute(
                    text(
                        f"SELECT id, birth_date FROM {table} "
                        "WHERE birth_date IS NOT NULL AND birth_date != ''"
                    )
                ).fetchall()

                count = 0
                for row_id, birth_date in rows:
                    if is_encrypted(birth_date):
                        continue
                    encrypted_val = encrypt(birth_date)
                    conn.execute(
                        text(f"UPDATE {table} SET birth_date = :enc WHERE id = :id"),
                        {"enc": encrypted_val, "id": row_id},
                    )
                    count += 1

                conn.commit()
                if count:
                    logging.info(f"[startup] Encrypted {count} plaintext birth_date value(s) in {table}")
    except Exception as exc:
        logging.error(f"[startup] birth_date encryption failed: {exc}")