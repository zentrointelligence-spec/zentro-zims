"""Authentication schemas."""
from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field

from app.schemas.agency import AgencyOut
from app.schemas.user import UserOut


class RegisterRequest(BaseModel):
    """Register a new agency + its admin user in a single call."""

    agency_name: str = Field(..., min_length=2, max_length=255)
    subscription_plan: str = Field(default="free", max_length=50)
    admin_name: str = Field(..., min_length=1, max_length=255)
    admin_email: EmailStr
    admin_password: str = Field(..., min_length=8, max_length=128)


class RegisterResponse(BaseModel):
    agency: AgencyOut
    user: UserOut
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
