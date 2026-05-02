"""Document upload schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    agency_id: int
    related_type: str
    related_id: int
    filename: str
    file_path: str
    file_size_kb: int
    content_type: str
    uploaded_by_user_id: int | None
    created_at: datetime


class DocumentListResponse(BaseModel):
    items: list[DocumentResponse]
    total: int
