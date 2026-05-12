"""Lead model — the top of the insurance sales funnel.

A Lead represents a prospect before they become a Customer. The lifecycle:
  new → contacted → qualified → proposal_sent → converted (Customer) / lost

Design decisions:
1. ``tags`` is a JSON array of strings (not a normalized many-to-many table).
   Tags are simple labels; we don't need tag management UI in Phase 1.
   PostgreSQL stores this as jsonb; SQLite as text — both queryable.
2. ``lead_score`` is a 0-100 float populated by the AI scoring layer.
   NULL means "not yet scored".
3. ``estimated_value`` is Decimal for currency precision.
4. ``last_contact_at`` is updated by the Interaction/Note layers to track
   recency for follow-up automation.
5. Soft-delete preserves the lead record and all related notes/interactions
   for compliance and analytics.
"""
from __future__ import annotations

import enum
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    JSON,
    DateTime,
    Enum,
    ForeignKey,
    Numeric,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.interaction import Interaction
    from app.models.user import User


class LeadStatus(str, enum.Enum):
    """Kanban pipeline stages for a lead.

    The ordering here matches the typical sales flow left-to-right.
    """

    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    PROPOSAL_SENT = "proposal_sent"
    CONVERTED = "converted"
    LOST = "lost"


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    insurance_type: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[LeadStatus] = mapped_column(
        Enum(LeadStatus, name="lead_status"),
        nullable=False,
        default=LeadStatus.NEW,
        index=True,
    )
    source: Mapped[str | None] = mapped_column(String(64), nullable=True)
    notes: Mapped[str | None] = mapped_column(
        String(2048), nullable=True,
        doc="Quick summary notes (distinct from structured LeadNote timeline)",
    )

    # --- CRM enrichment ---
    tags: Mapped[list[str] | None] = mapped_column(
        JSON,
        nullable=True,
        default=list,
        doc="JSON array of tag strings, e.g. [\"hot\", \"referral\"]",
    )
    assigned_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # --- AI / automation placeholders ---
    lead_score: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
        doc="AI-calculated score 0-100. NULL = not yet scored.",
    )
    estimated_value: Mapped[Decimal | None] = mapped_column(
        Numeric(14, 2),
        nullable=True,
        doc="Estimated policy premium or lifetime value",
    )
    whatsapp_opt_in: Mapped[bool] = mapped_column(
        nullable=False,
        default=False,
        doc="Explicit opt-in for WhatsApp messaging (GDPR/compliance)",
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
    last_contact_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
        doc="Last time an agent touched this lead (note, call, message)",
    )

    # --- Soft delete ---
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )

    # --- Tenant isolation ---
    agency_id: Mapped[int] = mapped_column(
        ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Relationships
    assigned_user: Mapped["User | None"] = relationship(
        "User", foreign_keys=[assigned_user_id]
    )
    interactions: Mapped[list["Interaction"]] = relationship(
        "Interaction",
        back_populates="lead",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    lead_notes: Mapped[list["LeadNote"]] = relationship(
        "LeadNote",
        back_populates="lead",
        cascade="all, delete-orphan",
        order_by="desc(LeadNote.created_at)",
        lazy="selectin",
    )

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None

    @property
    def tag_list(self) -> list[str]:
        """Normalized tag accessor (handles NULL)."""
        return self.tags or []

    def add_tag(self, tag: str) -> None:
        """Idempotent tag addition."""
        current = set(self.tag_list)
        current.add(tag.lower().strip())
        self.tags = sorted(current)

    def remove_tag(self, tag: str) -> None:
        """Idempotent tag removal."""
        current = set(self.tag_list)
        current.discard(tag.lower().strip())
        self.tags = sorted(current) if current else None

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Lead id={self.id} name={self.name!r} status={self.status.value}>"


class LeadNote(Base):
    """Structured activity timeline for a lead.

    Every meaningful touch (call, email, meeting, status change) creates
    a LeadNote. This replaces unstructured ``Lead.notes`` with a searchable,
    auditable timeline.

    Design decisions:
    1. ``note_type`` categorizes the activity for filtering and reporting.
    2. ``metadata`` is a JSON blob for flexible extensibility (call duration,
       email subject, meeting location, etc.) without schema migrations.
    3. Soft-delete is NOT supported — notes are append-only audit history.
    """
    __tablename__ = "lead_notes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    lead_id: Mapped[int] = mapped_column(
        ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True
    )
    content: Mapped[str] = mapped_column(String(4000), nullable=False)
    note_type: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="general",
        doc="call | email | meeting | status_change | whatsapp | system | general",
    )
    extra_data: Mapped[dict[str, Any] | None] = mapped_column(
        JSON,
        nullable=True,
        doc="Flexible JSON blob for type-specific data",
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

    lead: Mapped["Lead"] = relationship("Lead", back_populates="lead_notes")
    created_by: Mapped["User | None"] = relationship("User")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<LeadNote id={self.id} lead_id={self.lead_id} type={self.note_type}>"
