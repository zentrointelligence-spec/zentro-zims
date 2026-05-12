"""Auth routes: register, login, refresh, logout, me.

All endpoints are public (no JWT required) except ``/me`` and ``/logout``.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.logging import get_logger
from app.models.user import User
from app.schemas.auth import (
    AuthMeOut,
    LoginRequest,
    LoginResponse,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
    RegisterResponse,
    TokenPair,
)
from app.schemas.agency import AgencyMeOut
from app.schemas.user import UserOut
from app.services.auth_service import AuthService

logger = get_logger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


def _client_ip(request: Request) -> str | None:
    """Extract client IP respecting proxy headers."""
    return getattr(request.state, "client_ip", None)


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new agency + its first admin",
)
def register(
    payload: RegisterRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> RegisterResponse:
    """Create a new tenant (agency) and its first admin user.

    Returns both access and refresh tokens so the user is immediately
    authenticated without a second login request.
    """
    svc = AuthService(db)
    result = svc.register(payload, ip_address=_client_ip(request))
    return RegisterResponse(
        agency=result["agency"],
        user=result["user"],
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
    )


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Log in with email + password",
)
def login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> LoginResponse:
    """Authenticate and receive a token pair.

    The refresh token should be stored securely (httpOnly cookie or
    secure mobile storage) and used only with ``POST /auth/refresh``.
    """
    svc = AuthService(db)
    return svc.login(payload, ip_address=_client_ip(request))


@router.post(
    "/refresh",
    response_model=TokenPair,
    summary="Exchange refresh token for a new token pair",
)
def refresh(
    payload: RefreshRequest,
    db: Session = Depends(get_db),
) -> TokenPair:
    """Rotate access token using a valid refresh token.

    Returns a **new** refresh token (token rotation) to mitigate replay attacks.
    The old refresh token is implicitly invalidated because only the latest
    token should be stored client-side.
    """
    svc = AuthService(db)
    return svc.refresh(payload.refresh_token)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Log out and invalidate refresh token",
)
def logout(
    payload: LogoutRequest,
    db: Session = Depends(get_db),
) -> Response:
    """Blacklist the refresh token so it can no longer be used.

    Access tokens remain valid until expiry (short-lived by design).
    Client should delete both tokens from storage.
    """
    svc = AuthService(db)
    svc.logout(payload.refresh_token)


@router.get(
    "/me",
    response_model=AuthMeOut,
    summary="Current authenticated user and agency",
)
def auth_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AuthMeOut:
    """Return the current user profile plus their agency context.

    This is the primary endpoint for the frontend to hydrate user state
    after page load or token refresh.
    """
    from app.repositories.agency import AgencyRepository

    agency = AgencyRepository(db).get(current_user.agency_id)
    if agency is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found",
        )
    return AuthMeOut(
        user=UserOut.model_validate(current_user),
        agency=AgencyMeOut.model_validate(agency),
    )
