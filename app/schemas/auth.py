"""Authentication schemas — Pydantic v2.

All request/response models for the auth subsystem.
"""
from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field

from app.schemas.agency import AgencyOut
from app.schemas.user import UserOut


class RegisterRequest(BaseModel):
    """Register a new agency + its admin user in a single call.

    This is the onboarding flow for new tenants.
    """

    agency_name: str = Field(..., min_length=2, max_length=255)
    subscription_plan: str = Field(default="starter", max_length=50)
    admin_name: str = Field(..., min_length=1, max_length=255)
    admin_email: EmailStr
    admin_password: str = Field(..., min_length=8, max_length=128)


class RegisterResponse(BaseModel):
    """Successful registration response."""

    agency: AgencyOut
    user: UserOut
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    """Login with email + password."""

    email: EmailStr
    password: str = Field(..., min_length=1)


class TokenPair(BaseModel):
    """Access + refresh token pair.

    The refresh token must be stored securely (httpOnly cookie or
    secure storage) and sent only to ``POST /auth/refresh``.
    """

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginResponse(TokenPair):
    """Login response includes the authenticated user."""

    user: "UserOut"


class RefreshRequest(BaseModel):
    """Request body for token refresh."""

    refresh_token: str


class LogoutRequest(BaseModel):
    """Request body for logout (invalidates refresh token)."""

    refresh_token: str


class AuthMeOut(BaseModel):
    """Current authenticated user + agency context."""

    user: UserOut
    agency: AgencyOut
