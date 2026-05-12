"""Application configuration via Pydantic Settings.

This module is the single source of truth for all environment-driven
configuration. It supports:

- PostgreSQL (production / Docker)
- SQLite (local quick dev — autodetected via URL prefix)
- Redis (cache + Celery broker)
- Celery (background task queue — Phase 3)

Import the cached ``settings`` singleton everywhere:
    from app.core.config import settings
"""
from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed, validated settings loaded from environment / .env.

    Design decisions:
    1. ``extra="ignore"`` — allows .env files to contain frontend vars
       without raising validation errors.
    2. ``lru_cache`` on ``get_settings()`` — prevents re-parsing on every
       import, which matters for CLI tools and tests.
    3. Properties like ``is_sqlite`` and ``max_document_bytes`` keep
       derived values close to their source.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ------------------------------------------------------------------
    # Application
    # ------------------------------------------------------------------
    app_name: str = "Zentro ZIMS"
    app_env: Literal["development", "staging", "production"] = "development"
    debug: bool = False
    log_level: str = "INFO"
    api_v1_prefix: str = "/api/v1"

    # CORS — set to specific origins in production, e.g. '["https://app.example.com"]'
    cors_origins: list[str] = ["*"]

    # ------------------------------------------------------------------
    # Database
    # ------------------------------------------------------------------
    # PostgreSQL is the production default.
    # For local dev without Postgres installed, override in .env:
    #   DATABASE_URL=sqlite:///./zims.db
    database_url: str = "postgresql+psycopg2://zims:zims@localhost:5432/zims"

    # SQLAlchemy connection pool tuning (PostgreSQL only)
    db_pool_size: int = 5
    db_max_overflow: int = 10
    db_pool_timeout: int = 30
    db_pool_recycle: int = 1800  # 30 minutes — recycle stale connections

    # ------------------------------------------------------------------
    # Redis (cache, Celery broker, rate-limit store)
    # ------------------------------------------------------------------
    redis_url: str = "redis://localhost:6379/0"

    # ------------------------------------------------------------------
    # Celery (background task queue — Phase 3)
    # ------------------------------------------------------------------
    # Defaults to Redis if not explicitly set.
    celery_broker_url: str = ""
    celery_result_backend: str = ""

    # ------------------------------------------------------------------
    # JWT / Security
    # ------------------------------------------------------------------
    # Default dev key is safe for local use ONLY. Production validator below
    # enforces 48+ chars when APP_ENV=production.
    secret_key: str = Field(
        default="dev-secret-key-not-for-production-use-32-chars-min",
        min_length=32,
        description="Set SECRET_KEY in .env — at least 32 characters.",
    )
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30  # 30 minutes — short-lived access tokens
    refresh_token_expire_days: int = 7  # 7 days — long-lived refresh tokens

    # ------------------------------------------------------------------
    # OpenAI
    # ------------------------------------------------------------------
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # ------------------------------------------------------------------
    # Twilio
    # ------------------------------------------------------------------
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_whatsapp_from: str = "whatsapp:+14155238886"

    # ------------------------------------------------------------------
    # Scheduler (APScheduler — Phase 1-2)
    # ------------------------------------------------------------------
    renewal_window_days: int = 30
    renewal_job_hour: int = 2
    renewal_job_minute: int = 0
    birthday_job_hour: int = 8
    birthday_job_minute: int = 0

    # ------------------------------------------------------------------
    # Excel import
    # ------------------------------------------------------------------
    max_import_file_size_mb: int = 5

    # ------------------------------------------------------------------
    # Document uploads
    # ------------------------------------------------------------------
    upload_dir: str = "./uploads"
    max_document_size_mb: int = 10

    # ------------------------------------------------------------------
    # SendGrid (optional — stub mode when key is blank)
    # ------------------------------------------------------------------
    sendgrid_api_key: str = ""
    email_from: str = "noreply@zentro.io"
    email_from_name: str = "Zentro ZIMS"

    # ------------------------------------------------------------------
    # Internal integrations
    # ------------------------------------------------------------------
    zims_internal_api_key: str = ""

    # ------------------------------------------------------------------
    # DevOps / runtime behaviour
    # ------------------------------------------------------------------
    # When True, run ``alembic upgrade head`` on app startup (Docker prod).
    run_alembic_on_startup: bool = False

    # Cloud SQL instance connection name (e.g. project:region:instance).
    # Only needed when using Unix socket connections on Cloud Run.
    # If set, DATABASE_URL will be auto-patched to use the socket path.
    cloud_sql_instance: str = ""

    # When True, enable detailed SQL echo (dev only — very noisy).
    db_echo: bool = False

    # --- Redis token blacklist (optional) ---
    # If Redis is available, logout will blacklist refresh tokens.
    # If blank, logout is client-side only (token remains valid until expiry).
    redis_token_blacklist_prefix: str = "zims:token:blacklist"

    # ------------------------------------------------------------------
    # Stripe (optional — stripe_client uses stub mode when secret is blank)
    # ------------------------------------------------------------------
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_growth_price_id: str = ""
    stripe_pro_price_id: str = ""

    # ==================================================================
    # Validators
    # ==================================================================
    @model_validator(mode="after")
    def _production_secret(self) -> "Settings":
        """Enforce strong SECRET_KEY in production environments."""
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

    @model_validator(mode="after")
    def _celery_defaults(self) -> "Settings":
        """Default Celery broker/result to Redis URL if not explicitly set."""
        if not self.celery_broker_url:
            self.celery_broker_url = self.redis_url
        if not self.celery_result_backend:
            self.celery_result_backend = self.redis_url
        return self

    # ==================================================================
    # Properties
    # ==================================================================
    @property
    def is_sqlite(self) -> bool:
        """True when the configured database is SQLite."""
        return self.database_url.startswith("sqlite")

    @property
    def max_document_bytes(self) -> int:
        return self.max_document_size_mb * 1024 * 1024

    @property
    def db_connect_args(self) -> dict:
        """Connection arguments passed to SQLAlchemy create_engine.

        SQLite requires ``check_same_thread=False`` because FastAPI uses
        a thread pool for sync endpoints. PostgreSQL does not need this.
        """
        return {"check_same_thread": False} if self.is_sqlite else {}

    @property
    def db_engine_kwargs(self) -> dict:
        """Additional keyword arguments for create_engine.

        PostgreSQL benefits from connection pooling; SQLite does not.
        """
        if self.is_sqlite:
            return {}
        return {
            "pool_size": self.db_pool_size,
            "max_overflow": self.db_max_overflow,
            "pool_timeout": self.db_pool_timeout,
            "pool_recycle": self.db_pool_recycle,
        }


# =============================================================================
# Preflight check — logs missing vars before Pydantic validation fails
# =============================================================================
def _log_preflight() -> None:
    """Print warnings for common missing environment variables.

    This runs *before* Settings() instantiation so developers see helpful
    messages in Cloud Run logs even if validation eventually fails.
    """
    import os

    critical = ["SECRET_KEY", "DATABASE_URL"]
    missing = [v for v in critical if not os.getenv(v)]
    if missing:
        print(f"[PREFLIGHT] Missing env vars: {missing} — defaults will be used")

    # Auto-patch DATABASE_URL for Cloud SQL Unix socket if cloud_sql_instance is set
    instance = os.getenv("CLOUD_SQL_INSTANCE", "")
    db_url = os.getenv("DATABASE_URL", "")
    if instance and db_url and "/cloudsql/" not in db_url:
        # Reconstruct URL with Unix socket host parameter
        # Format: postgresql+psycopg2://user:pass@/db?host=/cloudsql/...
        from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode

        parsed = urlparse(db_url)
        socket_path = f"/cloudsql/{instance}"
        query = dict(parse_qsl(parsed.query))
        query["host"] = socket_path

        # Build new URL with empty host for Unix socket
        new_url = urlunparse((
            "postgresql+psycopg2",
            parsed.netloc,  # keep user:pass
            parsed.path,
            "",
            urlencode(query),
            "",
        ))
        # netloc contains hostname — we need to strip it for Unix socket
        new_url = new_url.replace(f"@{parsed.hostname}", "@")
        if parsed.port:
            new_url = new_url.replace(f":{parsed.port}", "")

        os.environ["DATABASE_URL"] = new_url
        print(f"[PREFLIGHT] Patched DATABASE_URL for Cloud SQL socket: {socket_path}")


_log_preflight()


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Cached settings accessor.

    Import as::

        from app.core.config import get_settings

    Or use the pre-instantiated singleton::

        from app.core.config import settings
    """
    return Settings()


settings = get_settings()
