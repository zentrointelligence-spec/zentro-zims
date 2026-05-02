"""Lead schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.lead import LeadStatus


class LeadBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    phone: str = Field(..., min_length=5, max_length=32)
    email: EmailStr | None = None
    insurance_type: str = Field(..., min_length=1, max_length=64)
    source: str | None = Field(default=None, max_length=64)
    notes: str | None = Field(default=None, max_length=1024)


class LeadCreate(LeadBase):
    status: LeadStatus = LeadStatus.NEW


class LeadUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    phone: str | None = Field(default=None, min_length=5, max_length=32)
    email: EmailStr | None = None
    insurance_type: str | None = Field(default=None, max_length=64)
    source: str | None = Field(default=None, max_length=64)
    notes: str | None = Field(default=None, max_length=1024)
    status: LeadStatus | None = None


class LeadOut(LeadBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: LeadStatus
    agency_id: int
    created_at: datetime
    updated_at: datetime
