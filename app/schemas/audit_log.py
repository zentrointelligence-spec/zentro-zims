"""Audit log API schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict

from app.schemas.common import PaginatedResponse


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None
    user_name: str
    action: str
    entity_type: str
    entity_id: int | None
    summary: str
    old_value: dict[str, Any] | list[Any] | None
    new_value: dict[str, Any] | list[Any] | None
    ip_address: str | None
    agency_id: int
    created_at: datetime


AuditLogListResponse = PaginatedResponse[AuditLogResponse]
