"""Lead schemas — Pydantic v2.

Designed for:
1. TanStack Table compatibility — ``PaginatedResponse[LeadOut]`` matches
   the shape expected by ``useReactTable`` + server-side pagination.
2. Kanban boards — ``LeadKanbanOut`` is a lightweight card view.
3. Cursor pagination — ``cursor`` + ``next_cursor`` fields are ready for
   keyset pagination when ``page_size`` grows beyond offset limits.
"""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.lead import LeadStatus


# =============================================================================
# LeadNote schemas
# =============================================================================
class LeadNoteBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=4000)
    note_type: str = Field(default="general", max_length=32)
    extra_data: dict | None = None


class LeadNoteCreate(LeadNoteBase):
    pass


class LeadNoteOut(LeadNoteBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lead_id: int
    created_by_id: int | None = None
    agency_id: int
    created_at: datetime


# =============================================================================
# Lead schemas
# =============================================================================
class LeadBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    phone: str = Field(..., min_length=5, max_length=32)
    email: EmailStr | None = None
    insurance_type: str = Field(..., min_length=1, max_length=64)
    source: str | None = Field(default=None, max_length=64)
    notes: str | None = Field(default=None, max_length=2048)
    tags: list[str] | None = Field(default_factory=list)
    assigned_user_id: int | None = None
    whatsapp_opt_in: bool = False

    @field_validator("tags", mode="before")
    @classmethod
    def normalize_tags(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return []
        return sorted({t.lower().strip() for t in v if t.strip()})


class LeadCreate(LeadBase):
    status: LeadStatus = LeadStatus.NEW
    lead_score: float | None = Field(default=None, ge=0, le=100)
    estimated_value: Decimal | None = Field(default=None, ge=0)

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "name": "John Doe",
            "phone": "+1-555-1234",
            "email": "john@example.com",
            "insurance_type": "auto",
            "source": "website",
            "tags": ["hot", "referral"],
        }
    })


class LeadUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    phone: str | None = Field(default=None, min_length=5, max_length=32)
    email: EmailStr | None = None
    insurance_type: str | None = Field(default=None, max_length=64)
    source: str | None = Field(default=None, max_length=64)
    notes: str | None = Field(default=None, max_length=2048)
    tags: list[str] | None = Field(default=None)
    status: LeadStatus | None = None
    assigned_user_id: int | None = None
    lead_score: float | None = Field(default=None, ge=0, le=100)
    estimated_value: Decimal | None = Field(default=None, ge=0)
    whatsapp_opt_in: bool | None = None
    last_contact_at: datetime | None = None

    @field_validator("tags", mode="before")
    @classmethod
    def normalize_tags(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return None
        return sorted({t.lower().strip() for t in v if t.strip()})


class LeadOut(LeadBase):
    """Full lead representation for detail views and table rows."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    status: LeadStatus
    lead_score: float | None = None
    estimated_value: Decimal | None = None
    last_contact_at: datetime | None = None
    agency_id: int
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None


class LeadDetailOut(LeadOut):
    """Lead with hydrated relationships for the detail page."""

    lead_notes: list[LeadNoteOut] = []


# =============================================================================
# Kanban schemas
# =============================================================================
class KanbanColumn(BaseModel):
    """A single column in the Kanban board."""

    status: str
    label: str
    count: int
    leads: list[LeadOut]


class KanbanBoard(BaseModel):
    """Full Kanban board state."""

    columns: list[KanbanColumn]


# =============================================================================
# Filter / query schemas
# =============================================================================
class LeadFilterParams(BaseModel):
    """URL query parameters for lead list filtering.

    All fields are optional. When combined, they use AND logic.
    """

    status: LeadStatus | None = None
    search: str | None = Field(
        default=None, max_length=100,
        description="Search name, phone, or email (case-insensitive prefix/contains)",
    )
    tags: list[str] | None = Field(
        default=None, description="Filter by any of these tags (OR logic)",
    )
    assigned_user_id: int | None = None
    source: str | None = Field(default=None, max_length=64)
    min_score: float | None = Field(default=None, ge=0, le=100)
    max_score: float | None = Field(default=None, ge=0, le=100)
    date_from: datetime | None = None
    date_to: datetime | None = None
    sort_by: str = Field(default="created_at", pattern="^(created_at|updated_at|last_contact_at|name|lead_score)$")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$")


# =============================================================================
# Bulk operation schemas
# =============================================================================
class LeadBulkItem(BaseModel):
    """A single lead inside a bulk import request.

    Validation constraints are intentionally loose here — the service layer
    performs thorough validation so that bulk previews can report per-row
    errors rather than rejecting the entire request at the Pydantic level.
    """

    name: str = Field(..., max_length=255)
    phone: str = Field(..., max_length=32)
    email: EmailStr | None = None
    insurance_type: str = Field(default="general", max_length=64)
    source: str | None = Field(default=None, max_length=64)
    status: LeadStatus = LeadStatus.NEW
    tags: list[str] | None = Field(default_factory=list)
    notes: str | None = Field(default=None, max_length=2048)


class LeadPreviewOut(LeadBase):
    """Lightweight lead representation for bulk import previews.

    Does not require DB-generated fields (id, timestamps) since the
    leads have not been persisted yet.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int | None = None
    status: LeadStatus = LeadStatus.NEW
    lead_score: float | None = None
    estimated_value: Decimal | None = None
    whatsapp_opt_in: bool | None = None
    agency_id: int | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class LeadBulkPreview(BaseModel):
    """Response from bulk import validation (dry-run)."""

    total: int
    valid: int
    invalid: int
    errors: list[dict[str, str]]  # [{"row": 3, "field": "phone", "message": "..."}]
    preview: list[LeadPreviewOut]  # First 5 successfully parsed leads


class LeadAssignRequest(BaseModel):
    assigned_user_id: int | None = Field(
        ..., description="Set to null to unassign",
    )


class LeadStatusUpdateRequest(BaseModel):
    status: LeadStatus
    note: str | None = Field(
        default=None, max_length=4000,
        description="Optional note explaining the status change",
    )
