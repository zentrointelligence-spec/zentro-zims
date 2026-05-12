"""SQLAlchemy engine, session factory, and declarative Base.

Architecture notes:
- PostgreSQL is the production target. Engine is tuned with connection pooling.
- SQLite is supported for local quick dev (autodetected via ``settings.is_sqlite``).
- Cloud SQL Unix socket connections are supported via ``?host=/cloudsql/...``
  query parameter in DATABASE_URL.
- ``Base.metadata.create_all`` is **disabled in production** — schema is owned
  by Alembic migrations (``run_alembic_on_startup`` should be True in Docker).
- Async engine placeholder is provided for future ASGI endpoints (Phase 4).
"""
from __future__ import annotations

import os
from typing import Generator
from pathlib import Path
from urllib.parse import urlparse, parse_qs, urlunparse

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# =============================================================================
# Connection string normalisation (Cloud SQL support)
# =============================================================================

def _normalise_database_url(url: str) -> str:
    """Fix common Cloud SQL connection string issues.

    Cloud SQL socket paths often come in formats that SQLAlchemy/psycopg2
    struggle with. This normaliser handles:

    1. ``postgresql://user:pass@/db?host=/cloudsql/...`` → correct format
    2. ``postgresql+psycopg2://user:pass@/db?host=/cloudsql/...`` → keeps driver
    3. Detects when a Unix socket path is provided and ensures host is empty.
    """
    parsed = urlparse(url)

    # If there's no host and a query param 'host' with /cloudsql/, it's already
    # in the correct Unix socket format.
    query_params = parse_qs(parsed.query)
    socket_path = query_params.get("host", [None])[0]

    if socket_path and socket_path.startswith("/cloudsql/"):
        # Ensure we're using psycopg2 driver (best supported for sockets)
        if parsed.scheme == "postgresql":
            parsed = parsed._replace(scheme="postgresql+psycopg2")
        # Empty netloc (@/) is required for Unix socket
        if parsed.hostname:
            parsed = parsed._replace(netloc="")
        logger.info("Using Cloud SQL Unix socket: %s", socket_path)
        return urlunparse(parsed)

    # Public IP / standard TCP connection — return as-is
    return url


# =============================================================================
# Build engine with error resilience
# =============================================================================

def _create_engine_safe():
    """Create SQLAlchemy engine with graceful fallback logging."""
    db_url = _normalise_database_url(settings.database_url)

    try:
        eng = create_engine(
            db_url,
            connect_args=settings.db_connect_args,
            pool_pre_ping=True,
            future=True,
            echo=settings.db_echo,
            **settings.db_engine_kwargs,
        )
        # Verify connection immediately so we fail fast with a clear message
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database engine connected: %s", db_url.split("@")[-1].split("/")[0])
        return eng
    except Exception as exc:
        logger.error(
            "Failed to connect to database. URL host=%s error=%s",
            urlparse(db_url).hostname or "unix-socket",
            exc,
        )
        raise


engine = _create_engine_safe()

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    class_=Session,
    future=True,
)


# =============================================================================
# Async Engine (future — placeholder for Phase 4 high-throughput endpoints)
# =============================================================================
# Uncomment and install ``asyncpg`` when migrating to async SQLAlchemy:
#
# from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
# _async_url = settings.database_url.replace("postgresql+psycopg2", "postgresql+asyncpg")
# async_engine = create_async_engine(_async_url, pool_pre_ping=True, future=True)
# AsyncSessionLocal = async_sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)


# =============================================================================
# Declarative Base
# =============================================================================
class Base(DeclarativeBase):
    """Declarative base for all ORM models.

    All models must inherit from this class so that:
    1. ``Base.metadata`` contains the full schema for Alembic autogenerate.
    2. ``init_db()`` can create tables for SQLite dev environments.
    """

    pass


# =============================================================================
# Session Dependency
# =============================================================================
def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a scoped DB session.

    Usage in route handlers::

        @router.get("/items")
        def list_items(db: Session = Depends(get_db)):
            ...

    The session is automatically closed when the request finishes, even if
    an unhandled exception is raised.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =============================================================================
# Alembic Integration
# =============================================================================
def run_alembic_upgrade_head() -> None:
    """Apply DB migrations via Alembic when ``run_alembic_on_startup`` is enabled.

    This is called inside the FastAPI lifespan so that Docker containers
    auto-migrate on every deploy. In local dev, migrations are typically
    run manually via ``alembic upgrade head``.
    """
    if not settings.run_alembic_on_startup:
        return
    if settings.is_sqlite:
        logger.info("SQLite detected — skipping Alembic (use init_db() instead)")
        return

    from alembic import command
    from alembic.config import Config

    try:
        root = Path(__file__).resolve().parents[2]
        ini_path = root / "alembic.ini"
        cfg = Config(str(ini_path))
        cfg.set_main_option("script_location", str(root / "alembic"))
        command.upgrade(cfg, "head")
        logger.info("Alembic migrations applied successfully")
    except Exception as exc:
        logger.error("Alembic migration failed: %s", exc)
        # Don't crash the app — Cloud Run will restart anyway, and this
        # gives us a chance to see the error in logs.
        raise


# =============================================================================
# Dev-only table creation (SQLite)
# =============================================================================
def init_db() -> None:
    """Create tables on empty SQLite dev DBs.

    In **production** (PostgreSQL), schema is managed exclusively by Alembic —
    this function is a no-op. The guard prevents accidental ``create_all``
    from shadowing migration-managed schema.
    """
    from app import models  # noqa: F401 — registers models on Base.metadata

    if settings.app_env == "production":
        logger.info("Production mode — skipping create_all (Alembic owns schema)")
        return
    if not settings.is_sqlite:
        logger.info("PostgreSQL dev — skipping create_all (run Alembic manually)")
        return

    logger.info("SQLite detected — creating tables via Base.metadata.create_all()")
    Base.metadata.create_all(bind=engine)
