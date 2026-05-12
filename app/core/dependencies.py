"""FastAPI dependencies: DB session, current user, RBAC guards, tenant context.

This module is the **security gate** of the entire application.
Every protected route MUST use one of these dependencies.

Architecture:
1. ``get_current_user`` decodes the JWT, verifies signature + expiry,
   checks the user exists/is active, and validates agency_id consistency.
2. ``get_current_agency`` returns the tenant object for the current user.
3. ``require_role`` is a factory that produces role-checking dependencies.
4. ``get_db`` provides the SQLAlchemy session (already existed).

Security invariants:
- No route should ever trust ``agency_id`` from request body/params;
  always use ``get_current_user().agency_id``.
- JWT ``agency_id`` is validated against the DB on every request to
  prevent stale tokens after tenant reassignment.
- Soft-deleted users are rejected (``deleted_at IS NULL`` check).
"""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.logging import get_logger
from app.core.security import ACCESS_TOKEN_TYPE, decode_token, is_token_blacklisted
from app.models.agency import Agency
from app.models.user import User, UserRole, role_level

logger = get_logger(__name__)

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False,
)


def _extract_user_token(request: Request) -> str | None:
    """Extract the user's JWT from headers.

    Supports Cloud Run service-to-service auth:
      - Authorization: Bearer <identity_token>  (Cloud Run IAM)
      - X-User-Authorization: Bearer <user_jwt>  (app auth)

    Falls back to standard Authorization header for local dev.
    """
    # 1. Check X-User-Authorization first (Cloud Run proxy pattern)
    user_auth = request.headers.get("x-user-authorization", "")
    if user_auth.lower().startswith("bearer "):
        return user_auth[7:].strip()

    # 2. Fall back to standard OAuth2 Authorization header
    if oauth2_scheme:
        # oauth2_scheme.auto_error=False, so it returns None on missing header
        try:
            return oauth2_scheme(request)
        except Exception:
            pass
    return None


# ---------------------------------------------------------------------------
# Core identity resolution
# ---------------------------------------------------------------------------
def get_current_user(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Resolve the authenticated user from the bearer token.

    Validates:
      - JWT signature and expiry
      - Token type == "access"
      - Token is not blacklisted (Redis check, best-effort)
      - User exists, is active, and is not soft-deleted
      - JWT ``agency_id`` matches the user's current ``agency_id`` in DB
        (prevents stale tokens after tenant moves)

    Raises:
        HTTPException(401) on any validation failure.
    """
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = _extract_user_token(request)
    if token is None:
        raise credentials_exc

    try:
        payload = decode_token(token)
        token_type = payload.get("type")
        if token_type != ACCESS_TOKEN_TYPE:
            raise credentials_exc
        user_id_str: str | None = payload.get("sub")
        if user_id_str is None:
            raise credentials_exc
        user_id = int(user_id_str)
        agency_claim = payload.get("agency_id")
        if agency_claim is None:
            raise credentials_exc
        agency_id_claim = int(agency_claim)
    except (JWTError, ValueError, TypeError):
        raise credentials_exc

    # Best-effort blacklist check (Redis optional)
    if is_token_blacklisted(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = (
        db.query(User)
        .filter(
            User.id == user_id,
            User.is_active.is_(True),
            User.deleted_at.is_(None),
        )
        .first()
    )
    if user is None:
        raise credentials_exc

    if user.agency_id != agency_id_claim:
        logger.warning(
            "JWT agency mismatch: user=%s jwt_agency=%s db_agency=%s",
            user.id,
            agency_id_claim,
            user.agency_id,
        )
        raise credentials_exc

    return user


def get_current_agency(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> Agency:
    """Return the current user's agency (tenant).

    Raises 404 if the agency is soft-deleted or inactive.
    This is a defense-in-depth check — in practice the agency should
    always exist if the user exists.
    """
    agency = (
        db.query(Agency)
        .filter(
            Agency.id == current_user.agency_id,
            Agency.is_active.is_(True),
            Agency.deleted_at.is_(None),
        )
        .first()
    )
    if agency is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found or inactive",
        )
    return agency


# ---------------------------------------------------------------------------
# RBAC guards — dependency factories
# ---------------------------------------------------------------------------
def require_role(min_role: UserRole) -> Depends:
    """Factory that returns a FastAPI dependency requiring ``min_role`` or higher.

    Usage::

        @router.post("/agents", dependencies=[Depends(require_role(UserRole.AGENCY_ADMIN))])
        def create_agent(...):
            ...

    Or inline::

        def create_agent(
            admin: User = Depends(require_role(UserRole.AGENCY_ADMIN)),
        ):
            ...
    """

    def _check_role(current_user: User = Depends(get_current_user)) -> User:
        if not current_user.has_role(min_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Minimum role '{min_role.value}' required",
            )
        return current_user

    return Depends(_check_role)


# Pre-built guards for common patterns
require_admin = require_role(UserRole.AGENCY_ADMIN)
require_super_admin = require_role(UserRole.SUPER_ADMIN)
require_agent = require_role(UserRole.AGENT)


# ---------------------------------------------------------------------------
# Backward-compatible aliases
# ---------------------------------------------------------------------------
def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Require agency_admin or higher."""
    if not current_user.has_role(UserRole.AGENCY_ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user
