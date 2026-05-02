"""Quote schemas."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.quote import QuoteStatus


class QuoteCreate(BaseModel):
    lead_id: int | None = Field(default=None, gt=0)
    customer_id: int | None = Field(default=None, gt=0)
    policy_type: str = Field(..., min_length=1, max_length=64)
    insurer: str = Field(default="", max_length=255)
    premium_quoted: Decimal = Field(..., ge=0)
    valid_until: date
    status: QuoteStatus = QuoteStatus.DRAFT
    notes: str | None = Field(default=None, max_length=8000)

    @model_validator(mode="after")
    def _one_party(self) -> "QuoteCreate":
        has_lead = self.lead_id is not None
        has_cust = self.customer_id is not None
        if has_lead == has_cust:
            raise ValueError("Set exactly one of lead_id or customer_id")
        return self


class QuoteUpdate(BaseModel):
    policy_type: str | None = Field(default=None, min_length=1, max_length=64)
    insurer: str | None = Field(default=None, max_length=255)
    premium_quoted: Decimal | None = Field(default=None, ge=0)
    valid_until: date | None = None
    status: QuoteStatus | None = None
    notes: str | None = Field(default=None, max_length=8000)


class QuoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    agency_id: int
    lead_id: int | None
    customer_id: int | None
    policy_type: str
    insurer: str
    premium_quoted: Decimal
    valid_until: date
    status: QuoteStatus
    notes: str | None
    created_at: datetime
    updated_at: datetime


class QuoteAcceptBody(BaseModel):
    """Optional overrides; when omitted, policy is auto-generated from the quote."""

    policy_number: str | None = Field(default=None, min_length=1, max_length=128)
    start_date: date | None = None
    expiry_date: date | None = None
