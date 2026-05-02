"""Agency schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AgencyBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    subscription_plan: str = Field(default="free", max_length=50)


class AgencyCreate(AgencyBase):
    pass


class AgencyOut(AgencyBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    stripe_customer_id: str | None = None
    stripe_subscription_id: str | None = None
    billing_status: str = "free"
    plan: str = "starter"
    plan_expires_at: datetime | None = None


class AgencyMeOut(BaseModel):
    """Current tenant (agency) for authenticated user."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    subscription_plan: str
    created_at: datetime
    whatsapp_number: str | None = None
    logo_url: str | None = None
    renewal_window_days: int | None = None
    timezone: str
    stripe_customer_id: str | None = None
    stripe_subscription_id: str | None = None
    billing_status: str = "free"
    plan: str = "starter"
    plan_expires_at: datetime | None = None


class AgencyMeUpdate(BaseModel):
    """Tenant settings (admin-managed)."""

    whatsapp_number: str | None = Field(default=None, max_length=64)
    logo_url: str | None = Field(default=None, max_length=512)
    renewal_window_days: int | None = Field(default=None, ge=1, le=730)
    timezone: str | None = Field(default=None, max_length=64)
