"""Lead enrichment: notes table, soft delete, AI fields, proposal_sent status.

Revision ID: e7f8a9b0c1d2
Revises: d5e6f7a8b9c0
Create Date: 2026-05-09 20:35:00.000000
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "e7f8a9b0c1d2"
down_revision = "d5e6f7a8b9c0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    is_pg = conn.dialect.name == "postgresql"

    # ------------------------------------------------------------------
    # 1. Expand lead_status enum (add proposal_sent)
    # ------------------------------------------------------------------
    if is_pg:
        # PostgreSQL: create temp enum, swap, drop old
        tmp_enum = postgresql.ENUM(
            "new", "contacted", "qualified", "proposal_sent", "converted", "lost",
            name="lead_status_tmp",
        )
        tmp_enum.create(conn, checkfirst=True)
        op.execute(
            "ALTER TABLE leads ALTER COLUMN status TYPE lead_status_tmp "
            "USING status::text::lead_status_tmp"
        )
        op.execute("DROP TYPE IF EXISTS lead_status")
        op.execute("ALTER TYPE lead_status_tmp RENAME TO lead_status")
    # SQLite: no native enum — strings are stored as VARCHAR

    # ------------------------------------------------------------------
    # 2. Add columns to leads
    # ------------------------------------------------------------------
    with op.batch_alter_table("leads", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("tags", sa.JSON(), nullable=True)
        )
        batch_op.add_column(
            sa.Column(
                "lead_score",
                sa.Numeric(5, 2),
                nullable=True,
            )
        )
        batch_op.add_column(
            sa.Column(
                "estimated_value",
                sa.Numeric(14, 2),
                nullable=True,
            )
        )
        batch_op.add_column(
            sa.Column(
                "whatsapp_opt_in",
                sa.Boolean(),
                nullable=True,
                server_default=sa.text("false"),
            )
        )
        batch_op.add_column(
            sa.Column(
                "last_contact_at",
                sa.DateTime(timezone=True),
                nullable=True,
            )
        )
        batch_op.add_column(
            sa.Column(
                "deleted_at",
                sa.DateTime(timezone=True),
                nullable=True,
            )
        )
        batch_op.create_index("ix_leads_deleted_at", ["deleted_at"])
        batch_op.create_index("ix_leads_last_contact_at", ["last_contact_at"])

    # Backfill whatsapp_opt_in
    op.execute("UPDATE leads SET whatsapp_opt_in = false WHERE whatsapp_opt_in IS NULL")
    with op.batch_alter_table("leads", schema=None) as batch_op:
        batch_op.alter_column("whatsapp_opt_in", nullable=False)

    # ------------------------------------------------------------------
    # 3. Create lead_notes table
    # ------------------------------------------------------------------
    op.create_table(
        "lead_notes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("lead_id", sa.Integer(), nullable=False),
        sa.Column("content", sa.String(length=4000), nullable=False),
        sa.Column("note_type", sa.String(length=32), nullable=False),
        sa.Column("extra_data", sa.JSON(), nullable=True),
        sa.Column("created_by_id", sa.Integer(), nullable=True),
        sa.Column("agency_id", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["agency_id"], ["agencies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["lead_id"], ["leads.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_lead_notes_agency_id", "lead_notes", ["agency_id"])
    op.create_index("ix_lead_notes_lead_id", "lead_notes", ["lead_id"])


def downgrade() -> None:
    conn = op.get_bind()
    is_pg = conn.dialect.name == "postgresql"

    # Drop lead_notes
    op.drop_index("ix_lead_notes_lead_id", table_name="lead_notes")
    op.drop_index("ix_lead_notes_agency_id", table_name="lead_notes")
    op.drop_table("lead_notes")

    # Drop lead columns
    with op.batch_alter_table("leads", schema=None) as batch_op:
        batch_op.drop_index("ix_leads_last_contact_at")
        batch_op.drop_index("ix_leads_deleted_at")
        batch_op.drop_column("deleted_at")
        batch_op.drop_column("last_contact_at")
        batch_op.drop_column("whatsapp_opt_in")
        batch_op.drop_column("estimated_value")
        batch_op.drop_column("lead_score")
        batch_op.drop_column("tags")

    # Revert lead_status enum
    if is_pg:
        tmp_enum = postgresql.ENUM(
            "new", "contacted", "qualified", "converted", "lost",
            name="lead_status_tmp",
        )
        tmp_enum.create(conn, checkfirst=True)
        op.execute(
            "UPDATE leads SET status = 'converted' WHERE status = 'proposal_sent'"
        )
        op.execute(
            "ALTER TABLE leads ALTER COLUMN status TYPE lead_status_tmp "
            "USING status::text::lead_status_tmp"
        )
        op.execute("DROP TYPE IF EXISTS lead_status")
        op.execute("ALTER TYPE lead_status_tmp RENAME TO lead_status")
