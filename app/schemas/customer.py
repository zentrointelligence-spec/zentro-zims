"""Customer schemas."""
from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CustomerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    phone: str = Field(..., min_length=5, max_length=32)
    email: EmailStr | None = None
    address: str | None = Field(default=None, max_length=512)
    date_of_birth: date | None = None
    id_number: str | None = Field(default=None, max_length=50)


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    phone: str | None = Field(default=None, min_length=5, max_length=32)
    email: EmailStr | None = None
    address: str | None = Field(default=None, max_length=512)
    date_of_birth: date | None = None
    id_number: str | None = Field(default=None, max_length=50)


class CustomerOut(CustomerBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    agency_id: int
    lead_id: int | None = None
    created_at: datetime
