"""Auth foundation: expand roles, add soft-delete, add security columns.

Revision ID: d5e6f7a8b9c0
Revises: c5d6e7f8a9b0
Create Date: 2026-05-09 20:25:00.000000

This migration:
1. Expands user_role enum from {admin, agent} → {super_admin, agency_admin, agent, staff}
2. Adds soft-delete (deleted_at) to users and agencies
3. Adds login security columns (failed_login_count, locked_until, last_login_at)
4. Adds updated_at timestamps
5. Adds agency.is_active for tenant suspension

PostgreSQL vs SQLite handling:
- PostgreSQL: native enum ALTER + ADD COLUMN
- SQLite: batch_alter_table (no native enum support)
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "d5e6f7a8b9c0"
down_revision = "c5d6e7f8a9b0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    is_pg = conn.dialect.name == "postgresql"

    # ------------------------------------------------------------------
    # 1. Agencies: add updated_at, deleted_at, is_active
    # ------------------------------------------------------------------
    with op.batch_alter_table("agencies", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True)
        )
        batch_op.add_column(
            sa.Column(
                "deleted_at",
                sa.DateTime(timezone=True),
                nullable=True,
            )
        )
        batch_op.add_column(
            sa.Column(
                "is_active",
                sa.Boolean(),
                nullable=True,
                server_default=sa.text("true"),
            )
        )
        batch_op.create_index("ix_agencies_deleted_at", ["deleted_at"])

    # Backfill updated_at for existing rows
    op.execute("UPDATE agencies SET updated_at = created_at WHERE updated_at IS NULL")
    with op.batch_alter_table("agencies", schema=None) as batch_op:
        batch_op.alter_column("updated_at", nullable=False)
        batch_op.alter_column("is_active", nullable=False)

    # ------------------------------------------------------------------
    # 2. Users: add updated_at, last_login_at, deleted_at, failed_login_count, locked_until
    # ------------------------------------------------------------------
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True)
        )
        batch_op.add_column(
            sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True)
        )
        batch_op.add_column(
            sa.Column(
                "deleted_at",
                sa.DateTime(timezone=True),
                nullable=True,
            )
        )
        batch_op.add_column(
            sa.Column(
                "failed_login_count",
                sa.Integer(),
                nullable=True,
                server_default=sa.text("0"),
            )
        )
        batch_op.add_column(
            sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True)
        )
        batch_op.create_index("ix_users_deleted_at", ["deleted_at"])

    # Backfill updated_at for existing rows
    op.execute("UPDATE users SET updated_at = created_at WHERE updated_at IS NULL")
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.alter_column("updated_at", nullable=False)
        batch_op.alter_column("failed_login_count", nullable=False)

    # ------------------------------------------------------------------
    # 3. Expand user_role enum
    # ------------------------------------------------------------------
    if is_pg:
        # PostgreSQL: create new enum, alter column, drop old enum
        new_enum = postgresql.ENUM(
            "super_admin", "agency_admin", "agent", "staff",
            name="user_role_new",
        )
        new_enum.create(conn, checkfirst=True)

        op.execute(
            "ALTER TABLE users ALTER COLUMN role TYPE user_role_new "
            "USING role::text::user_role_new"
        )

        # Update legacy values
        op.execute(
            "UPDATE users SET role = 'agency_admin' WHERE role = 'admin'"
        )
        # 'agent' stays 'agent'

        # Drop old enum, rename new enum
        op.execute("DROP TYPE IF EXISTS user_role")
        op.execute("ALTER TYPE user_role_new RENAME TO user_role")
    else:
        # SQLite: no native enum — values are stored as VARCHAR.
        # Update legacy values directly.
        op.execute("UPDATE users SET role = 'agency_admin' WHERE role = 'admin'")


def downgrade() -> None:
    conn = op.get_bind()
    is_pg = conn.dialect.name == "postgresql"

    # ------------------------------------------------------------------
    # 1. Revert role values
    # ------------------------------------------------------------------
    if is_pg:
        new_enum = postgresql.ENUM(
            "admin", "agent",
            name="user_role_old",
        )
        new_enum.create(conn, checkfirst=True)

        op.execute(
            "UPDATE users SET role = 'admin' WHERE role IN ('super_admin', 'agency_admin')"
        )
        op.execute(
            "UPDATE users SET role = 'agent' WHERE role = 'staff'"
        )

        op.execute(
            "ALTER TABLE users ALTER COLUMN role TYPE user_role_old "
            "USING role::text::user_role_old"
        )
        op.execute("DROP TYPE IF EXISTS user_role")
        op.execute("ALTER TYPE user_role_old RENAME TO user_role")
    else:
        op.execute(
            "UPDATE users SET role = 'admin' WHERE role IN ('super_admin', 'agency_admin')"
        )
        op.execute(
            "UPDATE users SET role = 'agent' WHERE role = 'staff'"
        )

    # ------------------------------------------------------------------
    # 2. Drop user columns
    # ------------------------------------------------------------------
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_index("ix_users_deleted_at")
        batch_op.drop_column("locked_until")
        batch_op.drop_column("failed_login_count")
        batch_op.drop_column("deleted_at")
        batch_op.drop_column("last_login_at")
        batch_op.drop_column("updated_at")

    # ------------------------------------------------------------------
    # 3. Drop agency columns
    # ------------------------------------------------------------------
    with op.batch_alter_table("agencies", schema=None) as batch_op:
        batch_op.drop_index("ix_agencies_deleted_at")
        batch_op.drop_column("is_active")
        batch_op.drop_column("deleted_at")
        batch_op.drop_column("updated_at")
