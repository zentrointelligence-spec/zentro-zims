"""SQLAlchemy engine, session factory, and declarative Base."""
from __future__ import annotations

from typing import Generator

from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

# SQLite needs `check_same_thread=False` for FastAPI's thread pool
_connect_args: dict = {"check_same_thread": False} if settings.is_sqlite else {}

engine = create_engine(
    settings.database_url,
    connect_args=_connect_args,
    pool_pre_ping=True,
    future=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    class_=Session,
    future=True,
)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""

    pass


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a scoped DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def run_alembic_upgrade_head() -> None:
    """Apply DB migrations via Alembic when ``run_alembic_on_startup`` is enabled."""
    if not settings.run_alembic_on_startup:
        return
    from alembic import command
    from alembic.config import Config

    root = Path(__file__).resolve().parents[2]
    ini_path = root / "alembic.ini"
    cfg = Config(str(ini_path))
    cfg.set_main_option("script_location", str(root / "alembic"))
    command.upgrade(cfg, "head")


def init_db() -> None:
    """Create tables on empty SQLite dev DBs.

    In **production**, schema is managed with Alembic — do not rely on
    ``create_all`` (tables must exist from ``alembic upgrade head``).
    """
    from app import models  # noqa: F401
    from app.core.config import settings

    if settings.app_env == "production":
        return
    Base.metadata.create_all(bind=engine)
