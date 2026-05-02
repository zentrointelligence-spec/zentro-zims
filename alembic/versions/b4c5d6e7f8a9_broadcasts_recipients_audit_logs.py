"""Broadcasts, broadcast recipients, and audit logs.

Revision ID: b4c5d6e7f8a9
Revises: a1b2c3d4e5f7
Create Date: 2026-04-20

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b4c5d6e7f8a9"
down_revision: Union[str, None] = "a1b2c3d4e5f7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "broadcasts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("target_segment", sa.String(length=64), nullable=False),
        sa.Column("policy_type_filter", sa.String(length=128), nullable=True),
        sa.Column("message_template", sa.Text(), nullable=False),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="draft"),
        sa.Column("sent_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("failed_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("agency_id", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["agency_id"], ["agencies.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_broadcasts_agency_id"), "broadcasts", ["agency_id"], unique=False)
    op.create_index(
        op.f("ix_broadcasts_target_segment"), "broadcasts", ["target_segment"], unique=False
    )
    op.create_index(op.f("ix_broadcasts_status"), "broadcasts", ["status"], unique=False)
    op.create_index(
        op.f("ix_broadcasts_scheduled_at"), "broadcasts", ["scheduled_at"], unique=False
    )
    op.create_index(op.f("ix_broadcasts_id"), "broadcasts", ["id"], unique=False)

    op.create_table(
        "broadcast_recipients",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("broadcast_id", sa.Integer(), nullable=False),
        sa.Column("customer_id", sa.Integer(), nullable=False),
        sa.Column("phone", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("agency_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["broadcast_id"], ["broadcasts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["agency_id"], ["agencies.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_broadcast_recipients_broadcast_id"),
        "broadcast_recipients",
        ["broadcast_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_broadcast_recipients_customer_id"),
        "broadcast_recipients",
        ["customer_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_broadcast_recipients_status"),
        "broadcast_recipients",
        ["status"],
        unique=False,
    )
    op.create_index(
        op.f("ix_broadcast_recipients_agency_id"),
        "broadcast_recipients",
        ["agency_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_broadcast_recipients_id"), "broadcast_recipients", ["id"], unique=False
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("user_name", sa.String(length=255), nullable=False),
        sa.Column("action", sa.String(length=32), nullable=False),
        sa.Column("entity_type", sa.String(length=64), nullable=False),
        sa.Column("entity_id", sa.Integer(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("old_value", sa.JSON(), nullable=True),
        sa.Column("new_value", sa.JSON(), nullable=True),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("agency_id", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["agency_id"], ["agencies.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_audit_logs_id"), "audit_logs", ["id"], unique=False)
    op.create_index(op.f("ix_audit_logs_user_id"), "audit_logs", ["user_id"], unique=False)
    op.create_index(op.f("ix_audit_logs_action"), "audit_logs", ["action"], unique=False)
    op.create_index(
        op.f("ix_audit_logs_entity_type"), "audit_logs", ["entity_type"], unique=False
    )
    op.create_index(
        op.f("ix_audit_logs_entity_id"), "audit_logs", ["entity_id"], unique=False
    )
    op.create_index(op.f("ix_audit_logs_agency_id"), "audit_logs", ["agency_id"], unique=False)
    op.create_index(
        op.f("ix_audit_logs_created_at"), "audit_logs", ["created_at"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_audit_logs_created_at"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_agency_id"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_entity_id"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_entity_type"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_action"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_user_id"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_id"), table_name="audit_logs")
    op.drop_table("audit_logs")

    op.drop_index(op.f("ix_broadcast_recipients_id"), table_name="broadcast_recipients")
    op.drop_index(op.f("ix_broadcast_recipients_agency_id"), table_name="broadcast_recipients")
    op.drop_index(op.f("ix_broadcast_recipients_status"), table_name="broadcast_recipients")
    op.drop_index(op.f("ix_broadcast_recipients_customer_id"), table_name="broadcast_recipients")
    op.drop_index(op.f("ix_broadcast_recipients_broadcast_id"), table_name="broadcast_recipients")
    op.drop_table("broadcast_recipients")

    op.drop_index(op.f("ix_broadcasts_id"), table_name="broadcasts")
    op.drop_index(op.f("ix_broadcasts_scheduled_at"), table_name="broadcasts")
    op.drop_index(op.f("ix_broadcasts_status"), table_name="broadcasts")
    op.drop_index(op.f("ix_broadcasts_target_segment"), table_name="broadcasts")
    op.drop_index(op.f("ix_broadcasts_agency_id"), table_name="broadcasts")
    op.drop_table("broadcasts")
