"""Policy schemas."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.policy import PolicyStatus


class PolicyBase(BaseModel):
    customer_id: int = Field(..., gt=0)
    policy_type: str = Field(..., min_length=1, max_length=64)
    policy_number: str = Field(..., min_length=1, max_length=128)
    start_date: date
    expiry_date: date
    premium: Decimal = Field(..., ge=0)


class PolicyCreate(PolicyBase):
    status: PolicyStatus = PolicyStatus.ACTIVE

    @model_validator(mode="after")
    def _check_dates(self) -> "PolicyCreate":
        if self.expiry_date < self.start_date:
            raise ValueError("expiry_date must be on or after start_date")
        return self


class PolicyUpdate(BaseModel):
    policy_type: str | None = Field(default=None, min_length=1, max_length=64)
    policy_number: str | None = Field(default=None, min_length=1, max_length=128)
    start_date: date | None = None
    expiry_date: date | None = None
    premium: Decimal | None = Field(default=None, ge=0)
    status: PolicyStatus | None = None


class PolicyOut(PolicyBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: PolicyStatus
    agency_id: int
    created_at: datetime
    updated_at: datetime
