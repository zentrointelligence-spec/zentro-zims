"""Agency settings (tenant configuration)."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AgencySettingsBase(BaseModel):
    logo_url: str | None = Field(default=None, max_length=512)
    whatsapp_number: str | None = Field(default=None, max_length=64)
    email_sender_name: str | None = Field(default=None, max_length=255)
    timezone: str = Field(default="UTC", max_length=64)
    renewal_window_days: int = Field(default=30, ge=1, le=3650)
    renewal_message_template: str | None = Field(default=None, max_length=16000)
    birthday_message_template: str | None = Field(default=None, max_length=16000)


class AgencySettingsUpdate(BaseModel):
    logo_url: str | None = Field(default=None, max_length=512)
    whatsapp_number: str | None = Field(default=None, max_length=64)
    email_sender_name: str | None = Field(default=None, max_length=255)
    timezone: str | None = Field(default=None, max_length=64)
    renewal_window_days: int | None = Field(default=None, ge=1, le=3650)
    renewal_message_template: str | None = Field(default=None, max_length=16000)
    birthday_message_template: str | None = Field(default=None, max_length=16000)


class AgencySettingsResponse(AgencySettingsBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    agency_id: int
    created_at: datetime
    updated_at: datetime
