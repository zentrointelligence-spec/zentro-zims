"""Customer model — the core insured entity.

A Customer is created either:
  1. Directly (walk-in, referral)
  2. Via lead conversion (Lead → Customer)

Design decisions:
1. **KYC fields** are flat columns (not a separate table) because KYC
   cardinality is 1:1 with customer in insurance. If KYC becomes multi-step
   with workflows later, we can migrate to a normalized table.
2. **Soft delete** preserves policy history and audit trails.
3. **Document listing** is done via the generic Document table
   (related_type="customer", related_id=customer.id). We don't add a
   SQLAlchemy relationship because the polymorphic join is complex and
   not needed for Phase 1 — the service layer queries directly.
4. **Policy count** is a computed property (not stored) to avoid
   denormalization drift.
"""
from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    JSON,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.dependent import Dependent
    from app.models.lead import Lead
    from app.models.policy import Policy


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    address: Mapped[str | None] = mapped_column(String(512), nullable=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)

    # --- KYC / Identity ---
    id_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    id_type: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        doc="passport | national_id | driving_license | other",
    )
    nationality: Mapped[str | None] = mapped_column(String(64), nullable=True)
    occupation: Mapped[str | None] = mapped_column(String(128), nullable=True)

    # --- Risk & Compliance ---
    risk_profile: Mapped[str | None] = mapped_column(
        String(16),
        nullable=True,
        doc="low | medium | high",
    )
    kyc_verified: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    kyc_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # --- Communication ---
    preferred_contact: Mapped[str | None] = mapped_column(
        String(16),
        nullable=True,
        default="phone",
        doc="phone | email | whatsapp",
    )
    communication_notes: Mapped[str | None] = mapped_column(
        String(2048), nullable=True
    )

    # --- Provenance ---
    lead_id: Mapped[int | None] = mapped_column(
        ForeignKey("leads.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # --- Tenant isolation ---
    agency_id: Mapped[int] = mapped_column(
        ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # --- Operational timestamps ---
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
    lead: Mapped["Lead | None"] = relationship("Lead")
    policies: Mapped[list["Policy"]] = relationship(
        "Policy",
        back_populates="customer",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    dependents: Mapped[list["Dependent"]] = relationship(
        "Dependent",
        back_populates="customer",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    customer_notes: Mapped[list["CustomerNote"]] = relationship(
        "CustomerNote",
        back_populates="customer",
        cascade="all, delete-orphan",
        order_by="desc(CustomerNote.created_at)",
        lazy="selectin",
    )

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None

    @property
    def policy_count(self) -> int:
        """Number of policies (excluding soft-deleted)."""
        return len([p for p in self.policies if getattr(p, "deleted_at", None) is None])

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Customer id={self.id} name={self.name!r}>"


class CustomerNote(Base):
    """Activity timeline for a customer.

    Mirrors ``LeadNote`` exactly — same semantics, different parent.
    This symmetry lets the frontend reuse the same timeline component
    for both leads and customers.
    """
    __tablename__ = "customer_notes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    content: Mapped[str] = mapped_column(String(4000), nullable=False)
    note_type: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="general",
        doc="call | email | meeting | kyc | policy | claim | system | general",
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

    customer: Mapped["Customer"] = relationship("Customer", back_populates="customer_notes")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<CustomerNote id={self.id} customer_id={self.customer_id} type={self.note_type}>"
