"""Stripe billing columns on agencies.

Revision ID: c5d6e7f8a9b0
Revises: b4c5d6e7f8a9
Create Date: 2026-04-20

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c5d6e7f8a9b0"
down_revision: Union[str, None] = "b4c5d6e7f8a9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    def _cols(table: str) -> set[str]:
        return {c["name"] for c in sa.inspect(bind).get_columns(table)}

    def _idx(table: str) -> set[str]:
        return {i["name"] for i in sa.inspect(bind).get_indexes(table)}

    ac = _cols("agencies")
    if "stripe_customer_id" not in ac:
        op.add_column(
            "agencies",
            sa.Column("stripe_customer_id", sa.String(length=100), nullable=True),
        )

    ac = _cols("agencies")
    if "stripe_subscription_id" not in ac:
        op.add_column(
            "agencies",
            sa.Column("stripe_subscription_id", sa.String(length=100), nullable=True),
        )

    ac = _cols("agencies")
    if "billing_status" not in ac:
        op.add_column(
            "agencies",
            sa.Column(
                "billing_status",
                sa.String(length=20),
                nullable=False,
                server_default="free",
            ),
        )

    ac = _cols("agencies")
    if "plan" not in ac:
        op.add_column(
            "agencies",
            sa.Column(
                "plan",
                sa.String(length=20),
                nullable=False,
                server_default="starter",
            ),
        )

    ac = _cols("agencies")
    if "plan_expires_at" not in ac:
        op.add_column(
            "agencies",
            sa.Column("plan_expires_at", sa.DateTime(timezone=True), nullable=True),
        )

    aix = _idx("agencies")
    idx_name = op.f("ix_agencies_stripe_customer_id")
    if "stripe_customer_id" in _cols("agencies") and idx_name not in aix:
        op.create_index(
            idx_name,
            "agencies",
            ["stripe_customer_id"],
            unique=True,
        )

    dialect = bind.dialect.name
    if dialect != "sqlite":
        for col, default in (
            ("billing_status", None),
            ("plan", None),
        ):
            try:
                op.alter_column("agencies", col, server_default=None)
            except Exception:
                pass


def downgrade() -> None:
    bind = op.get_bind()

    def _cols(table: str) -> set[str]:
        return {c["name"] for c in sa.inspect(bind).get_columns(table)}

    def _idx(table: str) -> set[str]:
        return {i["name"] for i in sa.inspect(bind).get_indexes(table)}

    aix = _idx("agencies")
    idx_name = op.f("ix_agencies_stripe_customer_id")
    if idx_name in aix:
        op.drop_index(idx_name, table_name="agencies")

    ac = _cols("agencies")
    for col in (
        "plan_expires_at",
        "plan",
        "billing_status",
        "stripe_subscription_id",
        "stripe_customer_id",
    ):
        if col in ac:
            op.drop_column("agencies", col)
