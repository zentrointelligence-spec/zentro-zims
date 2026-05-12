"""Alembic migration environment — uses app settings + SQLAlchemy models.

Design notes:
- Dynamically loads ``database_url`` from Pydantic Settings so that the
  same .env drives both the app and Alembic CLI.
- ``compare_type=True`` enables Alembic to detect column type changes.
- PostgreSQL is the production target; SQLite is supported for local dev.
- ``render_as_batch`` is NOT enabled because PostgreSQL supports DDL
  transactions natively. (Enable it only if you need SQLite autogenerate.)
"""
from __future__ import annotations

import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# Ensure SECRET_KEY exists for Settings() when running CLI in CI / fresh shells.
os.environ.setdefault(
    "SECRET_KEY",
    "dev-only-alembic-placeholder-key-32chars-min",
)

from app.core.config import settings  # noqa: E402
from app.core.database import Base  # noqa: E402

import app.models  # noqa: E402, F401  # registers models on Base.metadata

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

config.set_main_option("sqlalchemy.url", settings.database_url)
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL and not an Engine.
    Calls to context.execute() emit the given string to the script output.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine and associate a connection
    with the context. PostgreSQL uses NullPool because Alembic manages its
    own short-lived connection.
    """
    section = config.get_section(config.config_ini_section, {})
    section["sqlalchemy.url"] = settings.database_url
    connectable = engine_from_config(
        section,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
