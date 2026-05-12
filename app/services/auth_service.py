"""Auth service — business logic for authentication & authorization.

This layer sits between the HTTP routes and the repositories.
It owns:
- Registration (agency + admin creation)
- Login (credential verification + token issuance)
- Refresh (access token rotation)
- Logout (token blacklisting)

Why a service layer?
1. **Testability**: We can unit-test auth logic without spinning up FastAPI.
2. **Reusability**: The same registration flow can be called from CLI scripts,
   admin panels, or future API imports.
3. **Transaction safety**: All DB mutations in a single operation are wrapped
   in one commit/rollback boundary owned by the service.
4. **Audit integration**: Every significant action emits an audit log
   automatically, without routes needing to remember.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.core.security import (
    ACCESS_TOKEN_TYPE,
    REFRESH_TOKEN_TYPE,
    blacklist_refresh_token,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    is_token_blacklisted,
    verify_password,
)
from app.models.agency import Agency
from app.models.user import User, UserRole
from app.repositories.agency import AgencyRepository
from app.repositories.user import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest, TokenPair
from app.services.audit_service import log_action

logger = get_logger(__name__)

_MAX_FAILED_LOGINS = 5
_LOCKOUT_MINUTES = 30


class AuthService:
    """Authentication service — stateless, session-scoped."""

    def __init__(self, db: Session) -> None:
        self._db = db
        self._user_repo = UserRepository(db)
        self._agency_repo = AgencyRepository(db)

    # ------------------------------------------------------------------
    # Registration
    # ------------------------------------------------------------------
    def register(self, payload: RegisterRequest, ip_address: str | None = None) -> dict[str, Any]:
        """Create a new agency + its first admin user.

        Returns:
            dict with keys: agency, user, access_token, refresh_token
        """
        # Duplicate checks
        if self._agency_repo.get_by_name(payload.agency_name):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Agency with that name already exists",
            )
        if self._user_repo.get_by_email(payload.admin_email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with that email already exists",
            )

        # Create agency
        agency = Agency(
            name=payload.agency_name,
            subscription_plan=payload.subscription_plan,
        )
        self._agency_repo.create(agency)
        self._db.flush()  # populate agency.id

        # Create admin user
        admin = User(
            name=payload.admin_name,
            email=payload.admin_email.lower(),
            hashed_password=hash_password(payload.admin_password),
            role=UserRole.AGENCY_ADMIN,
            is_active=True,
            agency_id=agency.id,
        )
        self._user_repo.create(admin)
        self._db.commit()
        self._db.refresh(agency)
        self._db.refresh(admin)

        # Issue tokens
        access_token = create_access_token(
            subject=admin.id, agency_id=admin.agency_id, role=admin.role.value
        )
        refresh_token, _ = create_refresh_token(
            subject=admin.id, agency_id=admin.agency_id, role=admin.role.value
        )

        log_action(
            self._db,
            admin,
            "register",
            "agency",
            agency.id,
            f"Agency '{agency.name}' registered by {admin.email}",
            ip_address=ip_address,
        )

        return {
            "agency": agency,
            "user": admin,
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

    # ------------------------------------------------------------------
    # Login
    # ------------------------------------------------------------------
    def login(
        self, payload: LoginRequest, ip_address: str | None = None
    ) -> TokenPair:
        """Authenticate a user and issue a token pair.

        Implements account lockout after repeated failed attempts.
        """
        user = self._user_repo.get_by_email(payload.email.lower())

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        # Lockout check
        if user.is_locked:
            logger.warning("Locked account login attempt: %s", user.email)
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Account is temporarily locked due to failed login attempts. "
                       f"Try again after {user.locked_until.isoformat()}.",
            )

        if not user.is_active or user.is_deleted:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is disabled",
            )

        # Verify password
        if not verify_password(payload.password, user.hashed_password):
            self._record_failed_login(user)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        # Success — reset counters, update last login
        user.failed_login_count = 0
        user.locked_until = None
        user.last_login_at = datetime.now(tz=timezone.utc)
        self._db.commit()

        access_token = create_access_token(
            subject=user.id, agency_id=user.agency_id, role=user.role.value
        )
        refresh_token, _ = create_refresh_token(
            subject=user.id, agency_id=user.agency_id, role=user.role.value
        )

        log_action(
            self._db,
            user,
            "login",
            "user",
            user.id,
            f"User login: {user.email}",
            ip_address=ip_address,
        )

        from app.schemas.auth import LoginResponse

        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            user=user,
        )

    # ------------------------------------------------------------------
    # Refresh
    # ------------------------------------------------------------------
    def refresh(self, refresh_token: str) -> TokenPair:
        """Exchange a valid refresh token for a new access token pair.

        Security behavior:
        - Validates signature, expiry, and type (must be "refresh").
        - Checks Redis blacklist (if available).
        - Verifies user still exists and is active.
        - Issues a NEW refresh token (token rotation) to mitigate replay.
        """
        from jose import JWTError

        try:
            payload = decode_token(refresh_token)
        except JWTError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid refresh token: {exc}",
            )

        if payload.get("type") != REFRESH_TOKEN_TYPE:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )

        # Blacklist check
        if is_token_blacklisted(refresh_token):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked",
            )

        user_id = int(payload["sub"])
        agency_id = int(payload["agency_id"])
        role = payload["role"]

        user = self._user_repo.get(user_id, agency_id=agency_id)
        if user is None or not user.is_active or user.is_deleted:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User no longer exists or is inactive",
            )

        # Issue new pair (rotation)
        new_access = create_access_token(
            subject=user.id, agency_id=user.agency_id, role=user.role.value
        )
        new_refresh, _ = create_refresh_token(
            subject=user.id, agency_id=user.agency_id, role=user.role.value
        )

        return TokenPair(
            access_token=new_access,
            refresh_token=new_refresh,
            token_type="bearer",
        )

    # ------------------------------------------------------------------
    # Logout
    # ------------------------------------------------------------------
    def logout(self, refresh_token: str) -> None:
        """Invalidate a refresh token by blacklisting its jti.

        Returns 204 regardless of whether blacklisting succeeded (client-side
        deletion is the ultimate source of truth for access tokens).
        """
        blacklisted = blacklist_refresh_token(refresh_token)
        if blacklisted:
            logger.info("Refresh token blacklisted successfully")
        else:
            logger.warning("Refresh token blacklisting failed (Redis unavailable?)")

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _record_failed_login(self, user: User) -> None:
        """Increment failed login counter and lock account if threshold reached."""
        user.failed_login_count += 1
        if user.failed_login_count >= _MAX_FAILED_LOGINS:
            user.locked_until = datetime.now(tz=timezone.utc) + timedelta(
                minutes=_LOCKOUT_MINUTES
            )
            logger.warning(
                "Account locked for %s until %s",
                user.email,
                user.locked_until.isoformat(),
            )
        self._db.commit()


# Need timedelta import for lockout
from datetime import timedelta  # noqa: E402
