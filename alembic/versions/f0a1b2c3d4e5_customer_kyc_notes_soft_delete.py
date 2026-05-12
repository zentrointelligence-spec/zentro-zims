"""Customer KYC enrichment, notes table, soft delete.

Revision ID: f0a1b2c3d4e5
Revises: e7f8a9b0c1d2
Create Date: 2026-05-09 20:55:00.000000
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "f0a1b2c3d4e5"
down_revision = "e7f8a9b0c1d2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # 1. Add columns to customers
    # ------------------------------------------------------------------
    with op.batch_alter_table("customers", schema=None) as batch_op:
        batch_op.add_column(sa.Column("id_type", sa.String(length=32), nullable=True))
        batch_op.add_column(sa.Column("nationality", sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column("occupation", sa.String(length=128), nullable=True))
        batch_op.add_column(sa.Column("risk_profile", sa.String(length=16), nullable=True))
        batch_op.add_column(
            sa.Column("kyc_verified", sa.Boolean(), nullable=True, server_default=sa.text("false"))
        )
        batch_op.add_column(sa.Column("kyc_verified_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(
            sa.Column("preferred_contact", sa.String(length=16), nullable=True, server_default=sa.text("'phone'"))
        )
        batch_op.add_column(sa.Column("communication_notes", sa.String(length=2048), nullable=True))
        batch_op.add_column(sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.create_index("ix_customers_deleted_at", ["deleted_at"])

    # Backfill updated_at for existing rows
    op.execute("UPDATE customers SET updated_at = created_at WHERE updated_at IS NULL")
    op.execute("UPDATE customers SET kyc_verified = false WHERE kyc_verified IS NULL")
    op.execute("UPDATE customers SET preferred_contact = 'phone' WHERE preferred_contact IS NULL")

    with op.batch_alter_table("customers", schema=None) as batch_op:
        batch_op.alter_column("updated_at", nullable=False)
        batch_op.alter_column("kyc_verified", nullable=False)

    # ------------------------------------------------------------------
    # 2. Create customer_notes table
    # ------------------------------------------------------------------
    op.create_table(
        "customer_notes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("customer_id", sa.Integer(), nullable=False),
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
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_customer_notes_agency_id", "customer_notes", ["agency_id"])
    op.create_index("ix_customer_notes_customer_id", "customer_notes", ["customer_id"])


def downgrade() -> None:
    # Drop customer_notes
    op.drop_index("ix_customer_notes_customer_id", table_name="customer_notes")
    op.drop_index("ix_customer_notes_agency_id", table_name="customer_notes")
    op.drop_table("customer_notes")

    # Drop customer columns
    with op.batch_alter_table("customers", schema=None) as batch_op:
        batch_op.drop_index("ix_customers_deleted_at")
        batch_op.drop_column("deleted_at")
        batch_op.drop_column("updated_at")
        batch_op.drop_column("communication_notes")
        batch_op.drop_column("preferred_contact")
        batch_op.drop_column("kyc_verified_at")
        batch_op.drop_column("kyc_verified")
        batch_op.drop_column("risk_profile")
        batch_op.drop_column("occupation")
        batch_op.drop_column("nationality")
        batch_op.drop_column("id_type")
