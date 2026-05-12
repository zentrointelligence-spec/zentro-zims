"""Policy model — the core insurance contract entity.

A Policy belongs to exactly one Customer and one Agency.
It tracks coverage, premium, renewal lifecycle, payment status,
and serves as the anchor for claims and billing (future phases).

Design decisions:
1. **Soft delete** preserves premium history and audit trails.
2. **Coverage details** are stored as JSON for flexibility across
   policy types (life, health, auto, home, etc.).
3. **Payment status** is a simple enum; full billing history will
   live in the Billing module (Phase 2).
4. **Renewal tracking** fields support both APScheduler automation
   and manual overrides.
5. **PolicyNote** mirrors CustomerNote exactly — same semantics,
   different parent.
"""
from __future__ import annotations

import enum
from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    JSON,
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.customer import Customer


# =============================================================================
# Enums
# =============================================================================
class PolicyStatus(str, enum.Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    RENEWAL_DUE = "renewal_due"
    CANCELLED = "cancelled"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class PremiumFrequency(str, enum.Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUALLY = "annually"


# =============================================================================
# Policy
# =============================================================================
class Policy(Base):
    __tablename__ = "policies"
    __table_args__ = (
        UniqueConstraint(
            "agency_id",
            "policy_number",
            name="uq_policies_agency_id_policy_number",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # --- Core identity ---
    policy_type: Mapped[str] = mapped_column(
        String(64), nullable=False, doc="life | health | auto | home | travel | other"
    )
    policy_number: Mapped[str] = mapped_column(String(128), nullable=False, index=True)

    # --- Dates ---
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    expiry_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    # --- Financial ---
    premium: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0.00")
    )
    premium_frequency: Mapped[PremiumFrequency] = mapped_column(
        Enum(PremiumFrequency, name="premium_frequency"),
        nullable=False,
        default=PremiumFrequency.ANNUALLY,
    )
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    commission_rate: Mapped[float | None] = mapped_column(
        Numeric(5, 2), nullable=True, doc="Commission % (e.g. 15.00)"
    )
    commission_amount: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2), nullable=True
    )

    # --- Coverage ---
    coverage_details: Mapped[dict[str, Any] | None] = mapped_column(
        JSON,
        nullable=True,
        doc="Flexible coverage blob: coverage_amount, deductibles, benefits, riders",
    )

    # --- Insurer ---
    insurer_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    insurer_code: Mapped[str | None] = mapped_column(String(32), nullable=True)

    # --- Status & Payment ---
    status: Mapped[PolicyStatus] = mapped_column(
        Enum(PolicyStatus, name="policy_status"),
        nullable=False,
        default=PolicyStatus.ACTIVE,
        index=True,
    )
    payment_status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, name="payment_status"),
        nullable=False,
        default=PaymentStatus.PENDING,
        index=True,
    )

    # --- Renewal lifecycle ---
    renewal_due_date: Mapped[date | None] = mapped_column(
        Date, nullable=True, index=True, doc="Computed or overridden renewal deadline"
    )
    last_renewal_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    auto_renewal: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )

    # --- Reminder & AI hooks ---
    next_reminder_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, doc="WhatsApp/email reminder trigger time"
    )
    renewal_risk_score: Mapped[int | None] = mapped_column(
        Integer, nullable=True, doc="AI-predicted 0-100 renewal likelihood"
    )

    # --- Tenant & Audit ---
    agency_id: Mapped[int] = mapped_column(
        ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # --- Soft delete ---
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )

    # Relationships
    customer: Mapped["Customer"] = relationship(
        "Customer", back_populates="policies", lazy="joined"
    )
    policy_notes: Mapped[list["PolicyNote"]] = relationship(
        "PolicyNote",
        back_populates="policy",
        cascade="all, delete-orphan",
        order_by="desc(PolicyNote.created_at)",
        lazy="selectin",
    )

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Policy id={self.id} number={self.policy_number!r} status={self.status.value}>"


# =============================================================================
# PolicyNote — lifecycle timeline
# =============================================================================
class PolicyNote(Base):
    """Activity timeline for a policy.

    Mirrors ``CustomerNote`` exactly — same semantics, different parent.
    """

    __tablename__ = "policy_notes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    policy_id: Mapped[int] = mapped_column(
        ForeignKey("policies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    content: Mapped[str] = mapped_column(String(4000), nullable=False)
    note_type: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="general",
        doc="created | updated | renewed | cancelled | claim | payment | reminder | system | general",
    )
    extra_data: Mapped[dict[str, Any] | None] = mapped_column(
        JSON, nullable=True, doc="Flexible JSON blob for type-specific data"
    )

    created_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    agency_id: Mapped[int] = mapped_column(
        ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    policy: Mapped["Policy"] = relationship("Policy", back_populates="policy_notes")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<PolicyNote id={self.id} policy_id={self.policy_id} type={self.note_type}>"
