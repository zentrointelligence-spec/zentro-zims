"""Schemas for the Excel bulk-import endpoint."""
from __future__ import annotations

from pydantic import BaseModel, Field


class RowError(BaseModel):
    """A single row-level error collected during import."""

    row: int = Field(..., ge=1, description="1-indexed row number as seen in Excel")
    error: str
    code: str | None = Field(
        default=None,
        description="Stable machine-readable code, e.g. duplicate_policy, validation",
    )
    policy_number: str | None = None


class ImportResult(BaseModel):
    """Summary payload returned by POST /policies/import."""

    total_rows: int = Field(..., ge=0)
    imported: int = Field(..., ge=0)
    skipped: int = Field(
        ..., ge=0,
        description="Rows skipped because the policy_number already exists",
    )
    customers_created: int = Field(default=0, ge=0)
    renewals_flagged: int = Field(default=0, ge=0)
    tasks_created: int = Field(default=0, ge=0)
    dry_run: bool = False
    errors: list[RowError] = Field(default_factory=list)
