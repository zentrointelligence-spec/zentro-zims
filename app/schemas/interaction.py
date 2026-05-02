"""Interaction schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.interaction import InteractionDirection


class InteractionBase(BaseModel):
    lead_id: int = Field(..., gt=0)
    message: str = Field(..., min_length=1, max_length=4000)
    direction: InteractionDirection = InteractionDirection.OUTGOING
    channel: str = Field(default="whatsapp", max_length=32)


class InteractionCreate(InteractionBase):
    pass


class InteractionOut(InteractionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    agency_id: int
    timestamp: datetime
