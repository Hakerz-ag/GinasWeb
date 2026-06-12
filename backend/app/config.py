from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central FastAPI configuration pulled from environment variables."""

    app_name: str = "Gina's Tennis World API"

    # JWT Secret for auth tokens
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440  # 24 hours

    # CORS Origins (where the frontend runs)
    allowed_origins: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Database Configuration
    # Set DB_ENGINE=sqlite to use local SQLite (no PostgreSQL needed)
    # Set DB_ENGINE=postgresql (or leave empty) to use PostgreSQL
    db_engine: str = "sqlite"
    db_host: str = "localhost"
    db_name: str = "ginas_tennis"
    db_user: str = "postgres"
    db_password: str = "postgres"
    db_port: int = 5432

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def database_url(self) -> str:
        if self.db_engine == "sqlite":
            return "sqlite:///./ginas_tennis.db"
        return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"


@lru_cache
def get_settings() -> Settings:
    return Settings()