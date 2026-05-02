"""Agency (tenant) model."""
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class Agency(Base):
    __tablename__ = "agencies"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    subscription_plan: Mapped[str] = mapped_column(
        String(50), nullable=False, default="free"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # --- Tenant settings (Twilio "To" maps to whatsapp_number) ---
    whatsapp_number: Mapped[str | None] = mapped_column(
        String(64), nullable=True, index=True,
        doc="E.164 or whatsapp:+... inbound number for this agency",
    )
    logo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    renewal_window_days: Mapped[int | None] = mapped_column(
        Integer, nullable=True,
        doc="Override global renewal window; NULL = use app settings default",
    )
    timezone: Mapped[str] = mapped_column(
        String(64), nullable=False, default="UTC",
        doc="IANA zone name for scheduling (e.g. America/New_York)",
    )

    # --- Stripe / billing (per tenant) ---
    stripe_customer_id: Mapped[str | None] = mapped_column(
        String(100), nullable=True, unique=True
    )
    stripe_subscription_id: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    billing_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="free"
    )
    plan: Mapped[str] = mapped_column(
        String(20), nullable=False, default="starter"
    )
    plan_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    users: Mapped[list["User"]] = relationship(
        "User", back_populates="agency", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Agency id={self.id} name={self.name!r}>"
