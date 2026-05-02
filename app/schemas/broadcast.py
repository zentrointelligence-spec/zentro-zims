"""Pydantic models for WhatsApp broadcasts."""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import PaginatedResponse

TargetSegment = Literal[
    "all",
    "renewal_due",
    "expired",
    "birthday_this_month",
    "by_policy_type",
]


class BroadcastCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    target_segment: TargetSegment
    message_template: str = Field(..., min_length=1)
    scheduled_at: datetime | None = None
    policy_type_filter: str | None = Field(default=None, max_length=128)


class BroadcastResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    target_segment: str
    policy_type_filter: str | None
    message_template: str
    scheduled_at: datetime | None
    status: str
    sent_count: int
    failed_count: int
    agency_id: int
    created_at: datetime
    updated_at: datetime


class BroadcastRecipientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    broadcast_id: int
    customer_id: int
    phone: str
    status: str
    error_message: str | None
    sent_at: datetime | None
    agency_id: int


class BroadcastDetailResponse(BroadcastResponse):
    recipients: list[BroadcastRecipientResponse] = Field(default_factory=list)


class BroadcastPreviewBody(BaseModel):
    target_segment: TargetSegment
    policy_type_filter: str | None = Field(default=None, max_length=128)


class BroadcastPreviewCustomer(BaseModel):
    name: str
    phone: str


class BroadcastPreviewResponse(BaseModel):
    count: int
    customers: list[BroadcastPreviewCustomer]


BroadcastListResponse = PaginatedResponse[BroadcastResponse]
