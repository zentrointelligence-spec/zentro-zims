"""User schemas — Pydantic v2.

Design decisions:
1. ``UserRole`` is referenced as a string in schemas (not the enum class)
   to avoid SQLAlchemy import coupling in frontend/client code.
2. ``UserOut`` never includes ``hashed_password`` — security by omission.
3. ``UserUpdate`` uses ``exclude_unset=True`` semantics; all fields are optional.
"""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRoleStr(str):
    """Validated user role string."""

    @classmethod
    def _validate(cls, v: str) -> str:
        allowed = {"super_admin", "agency_admin", "agent", "staff"}
        if v not in allowed:
            raise ValueError(f"role must be one of {allowed}")
        return v


class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    role: str = Field(default="agent")

    @classmethod
    def validate_role(cls, v: str) -> str:
        allowed = {"super_admin", "agency_admin", "agent", "staff"}
        if v not in allowed:
            raise ValueError(f"role must be one of {allowed}")
        return v


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "name": "Alice Smith",
            "email": "alice@acme.com",
            "role": "agent",
            "password": "SecureP@ss123",
        }
    })


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    password: str | None = Field(default=None, min_length=8, max_length=128)
    role: str | None = Field(default=None)
    is_active: bool | None = None

    @classmethod
    def validate_role(cls, v: str | None) -> str | None:
        if v is None:
            return None
        allowed = {"super_admin", "agency_admin", "agent", "staff"}
        if v not in allowed:
            raise ValueError(f"role must be one of {allowed}")
        return v


class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    agency_id: int
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime | None = None
    deleted_at: datetime | None = None
