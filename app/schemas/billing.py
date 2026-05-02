"""Pydantic schemas for billing / Stripe endpoints."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PlanLimits(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    max_users: int | None
    max_leads: int | None
    max_policies: int | None


class PlanUsage(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    current_users: int
    current_leads: int
    current_policies: int


class BillingStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    plan: str
    billing_status: str
    plan_expires_at: datetime | None
    stripe_customer_id: str | None
    stripe_subscription_id: str | None
    limits: PlanLimits
    usage: PlanUsage


class CheckoutRequest(BaseModel):
    price_id: str = Field(..., min_length=1, max_length=255)
    success_url: str = Field(..., min_length=1, max_length=2048)
    cancel_url: str = Field(..., min_length=1, max_length=2048)


class CheckoutResponse(BaseModel):
    checkout_url: str


class PortalRequest(BaseModel):
    return_url: str = Field(..., min_length=1, max_length=2048)


class PortalResponse(BaseModel):
    portal_url: str


class WebhookAck(BaseModel):
    received: bool = True
