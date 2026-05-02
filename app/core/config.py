"""Application configuration via Pydantic Settings."""
from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed, validated settings loaded from environment / .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_name: str = "Zentro ZIMS"
    app_env: Literal["development", "staging", "production"] = "development"
    debug: bool = False
    log_level: str = "INFO"
    api_v1_prefix: str = "/api/v1"

    # CORS — set to specific origins in production, e.g. '["https://app.example.com"]'
    cors_origins: list[str] = ["*"]

    # Database
    database_url: str = "sqlite:///./zims.db"

    # JWT — MUST be set via env (min 32 chars). Stricter check in production.
    secret_key: str = Field(
        ...,
        min_length=32,
        description="Set SECRET_KEY in .env — at least 32 characters.",
    )

    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24h

    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # Twilio
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_whatsapp_from: str = "whatsapp:+14155238886"

    # Scheduler
    renewal_window_days: int = 30
    renewal_job_hour: int = 2
    renewal_job_minute: int = 0
    birthday_job_hour: int = 8
    birthday_job_minute: int = 0

    # Excel import
    max_import_file_size_mb: int = 5

    # Document uploads (local disk; use object storage in production if needed)
    upload_dir: str = "./uploads"
    max_document_size_mb: int = 10

    # SendGrid (optional — stub mode when key is blank)
    sendgrid_api_key: str = ""
    email_from: str = "noreply@zentro.io"
    email_from_name: str = "Zentro ZIMS"

    # When True, run ``alembic upgrade head`` on app startup (e.g. Docker prod).
    run_alembic_on_startup: bool = False

    # Stripe (optional — stripe_client uses stub mode when secret is blank)
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_growth_price_id: str = ""
    stripe_pro_price_id: str = ""

    @model_validator(mode="after")
    def _production_secret(self) -> "Settings":
        if self.app_env == "production":
            weak = (
                "change-me" in self.secret_key.lower()
                or "insecure" in self.secret_key.lower()
                or len(self.secret_key) < 48
            )
            if weak:
                raise ValueError(
                    "Production SECRET_KEY must be a strong random value (48+ chars), "
                    "not a placeholder."
                )
        return self

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")

    @property
    def max_document_bytes(self) -> int:
        return self.max_document_size_mb * 1024 * 1024


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Cached settings accessor (import as `from app.core.config import get_settings`)."""
    return Settings()


settings = get_settings()
