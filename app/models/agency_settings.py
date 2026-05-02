"""Per-agency configuration (1:1 with Agency)."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AgencySettings(Base):
    __tablename__ = "agency_settings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    agency_id: Mapped[int] = mapped_column(
        ForeignKey("agencies.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    logo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    whatsapp_number: Mapped[str | None] = mapped_column(String(64), nullable=True)
    email_sender_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="UTC")
    renewal_window_days: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    renewal_message_template: Mapped[str | None] = mapped_column(Text, nullable=True)
    birthday_message_template: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    agency = relationship("Agency", foreign_keys=[agency_id], lazy="joined")
