"""Customer schemas — Pydantic v2.

Designed for:
1. TanStack Table compatibility via ``PaginatedResponse[CustomerOut]``.
2. KYC workflows — ``kyc_verified`` and ``kyc_verified_at`` track compliance.
3. Lead conversion — ``lead_id`` links back to the originating lead.
4. Policy preparation — ``policy_count`` is computed, not stored.
"""
from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, computed_field


# =============================================================================
# CustomerNote schemas
# =============================================================================
class CustomerNoteBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=4000)
    note_type: str = Field(default="general", max_length=32)
    extra_data: dict | None = None


class CustomerNoteCreate(CustomerNoteBase):
    pass


class CustomerNoteOut(CustomerNoteBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    created_by_id: int | None = None
    agency_id: int
    created_at: datetime


# =============================================================================
# Customer schemas
# =============================================================================
class CustomerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    phone: str = Field(..., min_length=5, max_length=32)
    email: EmailStr | None = None
    address: str | None = Field(default=None, max_length=512)
    date_of_birth: date | None = None

    # KYC
    id_number: str | None = Field(default=None, max_length=50)
    id_type: str | None = Field(default=None, max_length=32)
    nationality: str | None = Field(default=None, max_length=64)
    occupation: str | None = Field(default=None, max_length=128)
    risk_profile: str | None = Field(default=None, max_length=16)

    # Communication
    preferred_contact: str | None = Field(default="phone", max_length=16)
    communication_notes: str | None = Field(default=None, max_length=2048)


class CustomerCreate(CustomerBase):
    lead_id: int | None = None

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "name": "Alice Johnson",
            "phone": "+1-555-9876",
            "email": "alice@example.com",
            "address": "123 Main St, New York, NY",
            "date_of_birth": "1985-03-15",
            "id_number": "A12345678",
            "id_type": "passport",
            "nationality": "US",
            "occupation": "Software Engineer",
            "risk_profile": "medium",
            "preferred_contact": "email",
        }
    })


class CustomerUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    phone: str | None = Field(default=None, min_length=5, max_length=32)
    email: EmailStr | None = None
    address: str | None = Field(default=None, max_length=512)
    date_of_birth: date | None = None
    id_number: str | None = Field(default=None, max_length=50)
    id_type: str | None = Field(default=None, max_length=32)
    nationality: str | None = Field(default=None, max_length=64)
    occupation: str | None = Field(default=None, max_length=128)
    risk_profile: str | None = Field(default=None, max_length=16)
    kyc_verified: bool | None = None
    kyc_verified_at: datetime | None = None
    preferred_contact: str | None = Field(default=None, max_length=16)
    communication_notes: str | None = Field(default=None, max_length=2048)


class CustomerOut(CustomerBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lead_id: int | None = None
    kyc_verified: bool
    kyc_verified_at: datetime | None = None
    agency_id: int
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None

    @computed_field
    @property
    def policy_count(self) -> int:
        """Number of active policies (computed from relationship)."""
        # When model_validate loads relationships, policies is a list
        policies = getattr(self, "policies", [])
        return len([p for p in policies if getattr(p, "deleted_at", None) is None])


class CustomerDetailOut(CustomerOut):
    """Customer with hydrated relationships for the detail page."""

    customer_notes: list[CustomerNoteOut] = []


# =============================================================================
# Filter schemas
# =============================================================================
class CustomerFilterParams(BaseModel):
    """URL query parameters for customer list filtering."""

    search: str | None = Field(
        default=None, max_length=100,
        description="Search name, phone, email, or id_number",
    )
    kyc_verified: bool | None = None
    risk_profile: str | None = Field(default=None, max_length=16)
    preferred_contact: str | None = Field(default=None, max_length=16)
    date_from: datetime | None = None
    date_to: datetime | None = None
    sort_by: str = Field(default="created_at", pattern="^(created_at|updated_at|name|date_of_birth)$")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$")
