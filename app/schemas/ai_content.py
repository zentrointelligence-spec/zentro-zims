"""Schemas for AI-assisted content generation."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

ContentType = Literal[
    "marketing_post",
    "renewal_message",
    "birthday_wish",
    "quote_summary",
    "follow_up_message",
]


class AIGenerateContext(BaseModel):
    customer_name: str | None = None
    policy_number: str | None = None
    expiry_date: str | None = None
    policy_type: str | None = None
    insurer: str | None = None
    premium: str | None = None
    platform: Literal["whatsapp", "facebook", "instagram"] | None = None


class AIGenerateRequest(BaseModel):
    type: ContentType
    context: AIGenerateContext = Field(default_factory=AIGenerateContext)


class AIGenerateResponse(BaseModel):
    type: str
    content: str
    generated_at: str
