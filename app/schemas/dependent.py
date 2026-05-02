"""Dependent schemas."""
from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

DependentRelationshipType = Literal["spouse", "child", "parent", "other"]


class DependentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    date_of_birth: date | None = None
    relationship: DependentRelationshipType = "other"
    id_number: str | None = Field(default=None, max_length=50)


class DependentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    agency_id: int
    name: str
    date_of_birth: date | None
    relationship: str
    id_number: str | None
    created_at: datetime


class DependentListResponse(BaseModel):
    items: list[DependentResponse]
    total: int
