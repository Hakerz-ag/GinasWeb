from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central FastAPI configuration pulled from environment variables."""

    app_name: str = "Gina's Tennis World API"

    # JWT Secret for auth tokens
    jwt_secret: str = "change-me-in-production"
    jwt_secret_prev: str = ""  # Previous JWT secret for key rotation (empty = no rotation)
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 15  # Access token lifetime (short-lived for security)
    jwt_refresh_expire_days: int = 7  # Refresh token lifetime

    # CORS Origins (where the frontend runs)
    # NEVER use ["*"] with allow_credentials=True
    allowed_origins: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://ginas-tennis-world-eta.vercel.app",
    ]

    # Database Configuration
    # Set DB_ENGINE=sqlite to use local SQLite (no PostgreSQL needed)
    # Set DB_ENGINE=postgresql (or leave empty) to use PostgreSQL
    # Alternatively, set DATABASE_URL directly (overrides individual DB_* vars)
    # In Pydantic, the env var name is derived from the field name:
    #   database_url_override → DATABASE_URL_OVERRIDE
    #   We use alias so the env var is simply DATABASE_URL
    database_url_override: str = ""  # Full connection string override (e.g. from cloud provider)
    db_engine: str = "sqlite"
    db_host: str = "localhost"
    db_name: str = "ginas_tennis"
    db_user: str = "postgres"
    db_password: str = "postgres"
    db_port: int = 5432

    # Stripe Configuration (payments)
    stripe_secret_key: str = ""          # sk_test_... or sk_live_...
    stripe_publishable_key: str = ""      # pk_test_... or pk_live_...
    stripe_webhook_secret: str = ""       # whsec_...
    stripe_currency: str = "usd"

    # Payment Methods — toggle which methods Gina accepts
    # All methods are enabled by default; set to False to disable
    cash_enabled: bool = True
    check_enabled: bool = True
    venmo_enabled: bool = True
    zelle_enabled: bool = True
    pay_at_location_enabled: bool = True

    # Payment method display info (shown to customers)
    venmo_handle: str = ""       # e.g. "@Gina-Tennis"
    zelle_info: str = ""         # e.g. "ginas@tennis.com" or phone number

    # Email Configuration (transactional emails)
    email_provider: str = "console"       # "console" (dev), "sendgrid", "postmark", "mailgun"
    sendgrid_api_key: str = ""
    email_from_address: str = "noreply@ginastennisworld.com"
    email_from_name: str = "Gina's Tennis World"
    email_base_url: str = "http://localhost:3000"  # for building links in emails

    # Contact form — where contact form submissions are sent
    contact_email: str = "GinasTennisWorld@gmail.com"  # Gina's email for contact form submissions
    gina_name: str = "Gina"  # Used in email greetings

    # Twilio (SMS) configuration — optional
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_from_number: str = ""  # E.164 formatted number, e.g. +1234567890

    # Frontend URL (for CORS and email links)
    frontend_url: str = "http://localhost:3000"

    # Environment
    environment: str = "development"  # "development", "staging", "production"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        env_prefix="",           # no prefix for env vars
    )

    # Allow DATABASE_URL env var to map to database_url_override field
    # Pydantic-settings will check DATABASE_URL_OVERRIDE first, then fall back
    # to the individual DB_* vars via the property below.

    @property
    def database_url(self) -> str:
        # Allow full DATABASE_URL_OVERRIDE override (common for cloud providers like Neon/Render)
        if self.database_url_override:
            return self.database_url_override
        if self.db_engine == "sqlite":
            return "sqlite:///./ginas_tennis.db"
        url = f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"
        # Cloud databases (Neon, Render, etc.) require SSL
        if self.environment == "production":
            url += "?sslmode=require"
        return url

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()