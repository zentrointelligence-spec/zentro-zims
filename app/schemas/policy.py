"""Policy schemas — Pydantic v2.

Designed for:
1. TanStack Table compatibility via ``PaginatedResponse[PolicyOut]``.
2. Renewal workflow — ``renewal_due_date``, ``auto_renewal`` track lifecycle.
3. Payment tracking — ``payment_status`` bridges to Billing module (Phase 2).
4. Coverage flexibility — ``coverage_details`` is a typed JSON blob.
"""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, computed_field, model_validator

from app.models.policy import PaymentStatus, PolicyStatus, PremiumFrequency


# =============================================================================
# PolicyNote schemas
# =============================================================================
class PolicyNoteBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=4000)
    note_type: str = Field(default="general", max_length=32)
    extra_data: dict[str, Any] | None = None


class PolicyNoteCreate(PolicyNoteBase):
    pass


class PolicyNoteOut(PolicyNoteBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    policy_id: int
    created_by_id: int | None = None
    agency_id: int
    created_at: datetime


# =============================================================================
# Coverage details sub-schema
# =============================================================================
class CoverageDetails(BaseModel):
    """Optional structured coverage data. All fields optional for flexibility."""

    coverage_amount: Decimal | None = Field(default=None, ge=0)
    coverage_type: str | None = Field(default=None, max_length=64)
    deductible: Decimal | None = Field(default=None, ge=0)
    benefits: list[str] | None = None
    riders: list[str] | None = None
    exclusions: list[str] | None = None


# =============================================================================
# Policy schemas
# =============================================================================
class PolicyBase(BaseModel):
    customer_id: int = Field(..., gt=0)
    policy_type: str = Field(..., min_length=1, max_length=64)
    policy_number: str = Field(..., min_length=1, max_length=128)
    start_date: date
    expiry_date: date
    premium: Decimal = Field(..., ge=0)
    premium_frequency: PremiumFrequency = PremiumFrequency.ANNUALLY
    currency: str = Field(default="USD", max_length=3)

    # Coverage
    coverage_details: CoverageDetails | dict[str, Any] | None = None

    # Insurer
    insurer_name: str | None = Field(default=None, max_length=128)
    insurer_code: str | None = Field(default=None, max_length=32)

    # Renewal
    auto_renewal: bool = False
    renewal_due_date: date | None = None

    # AI / Reminder hooks
    renewal_risk_score: int | None = Field(default=None, ge=0, le=100)


class PolicyCreate(PolicyBase):
    status: PolicyStatus = PolicyStatus.ACTIVE
    payment_status: PaymentStatus = PaymentStatus.PENDING
    commission_rate: float | None = Field(default=None, ge=0, le=100)
    commission_amount: Decimal | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def _check_dates(self) -> "PolicyCreate":
        if self.expiry_date < self.start_date:
            raise ValueError("expiry_date must be on or after start_date")
        return self

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "customer_id": 1,
                "policy_type": "auto",
                "policy_number": "POL-2026-001",
                "start_date": "2026-01-01",
                "expiry_date": "2026-12-31",
                "premium": "1200.00",
                "premium_frequency": "annually",
                "currency": "USD",
                "coverage_details": {
                    "coverage_amount": "50000.00",
                    "coverage_type": "comprehensive",
                    "deductible": "500.00",
                },
                "insurer_name": "SafeDrive Insurance",
                "auto_renewal": True,
            }
        }
    )


class PolicyUpdate(BaseModel):
    policy_type: str | None = Field(default=None, min_length=1, max_length=64)
    policy_number: str | None = Field(default=None, min_length=1, max_length=128)
    start_date: date | None = None
    expiry_date: date | None = None
    premium: Decimal | None = Field(default=None, ge=0)
    premium_frequency: PremiumFrequency | None = None
    currency: str | None = Field(default=None, max_length=3)
    coverage_details: CoverageDetails | dict[str, Any] | None = None
    insurer_name: str | None = Field(default=None, max_length=128)
    insurer_code: str | None = Field(default=None, max_length=32)
    status: PolicyStatus | None = None
    payment_status: PaymentStatus | None = None
    auto_renewal: bool | None = None
    renewal_due_date: date | None = None
    renewal_risk_score: int | None = Field(default=None, ge=0, le=100)
    commission_rate: float | None = Field(default=None, ge=0, le=100)
    commission_amount: Decimal | None = Field(default=None, ge=0)
    next_reminder_at: datetime | None = None


class PolicyOut(PolicyBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: PolicyStatus
    payment_status: PaymentStatus
    commission_rate: float | None = None
    commission_amount: Decimal | None = None
    last_renewal_at: datetime | None = None
    auto_renewal: bool
    renewal_due_date: date | None = None
    next_reminder_at: datetime | None = None
    renewal_risk_score: int | None = None
    agency_id: int
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None

    @computed_field
    @property
    def days_until_expiry(self) -> int | None:
        """Days remaining until policy expiry (None if already expired)."""
        from datetime import date as dt_date

        if self.deleted_at is not None:
            return None
        today = dt_date.today()
        if self.expiry_date < today:
            return None
        return (self.expiry_date - today).days


class PolicyDetailOut(PolicyOut):
    """Policy with hydrated relationships for the detail page."""

    policy_notes: list[PolicyNoteOut] = []


# =============================================================================
# Filter schemas
# =============================================================================
class PolicyFilterParams(BaseModel):
    """URL query parameters for policy list filtering."""

    search: str | None = Field(
        default=None,
        max_length=100,
        description="Search policy_number, policy_type, insurer_name",
    )
    status: PolicyStatus | None = None
    payment_status: PaymentStatus | None = None
    customer_id: int | None = Field(default=None, gt=0)
    policy_type: str | None = Field(default=None, max_length=64)
    expiry_from: date | None = None
    expiry_to: date | None = None
    sort_by: str = Field(
        default="created_at",
        pattern="^(created_at|updated_at|expiry_date|start_date|premium|policy_number)$",
    )
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$")
