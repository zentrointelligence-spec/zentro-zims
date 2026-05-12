"""User service — tenant-safe user CRUD and role management.

All operations are automatically scoped to the caller's agency_id.
Super_admin can optionally bypass agency scoping when managing
platform-wide user accounts.
"""
from __future__ import annotations

from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.repositories.user import UserRepository
from app.schemas.user import UserCreate, UserUpdate
from app.services.audit_service import log_action

logger = get_logger(__name__)


class UserService:
    """User management service — scoped to a single agency per instance."""

    def __init__(self, db: Session, agency_id: int) -> None:
        self._db = db
        self._agency_id = agency_id
        self._repo = UserRepository(db)

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------
    def get(self, user_id: int) -> User | None:
        """Fetch a user within the service's agency."""
        return self._repo.get(user_id, agency_id=self._agency_id)

    def get_or_404(self, user_id: int) -> User:
        """Fetch or raise 404."""
        user = self.get(user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return user

    def list_all(self) -> list[User]:
        """List all non-deleted users in the agency."""
        return self._repo.list(agency_id=self._agency_id)

    def list_by_role(self, role: UserRole) -> list[User]:
        """List users filtered by role."""
        return self._repo.list_by_role(role, agency_id=self._agency_id)

    # ------------------------------------------------------------------
    # Mutations
    # ------------------------------------------------------------------
    def create(self, payload: UserCreate, actor: User) -> User:
        """Create a new user within the agency.

        Enforces:
        - Email uniqueness across the platform
        - Role hierarchy (actor cannot create users with higher privilege)
        """
        email = payload.email.lower()
        if self._repo.exists_in_agency(email, self._agency_id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with that email already exists in this agency",
            )

        # Role hierarchy guard
        if role_level(payload.role) > role_level(actor.role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot assign a role higher than your own",
            )

        user = User(
            name=payload.name,
            email=email,
            hashed_password=hash_password(payload.password),
            role=payload.role,
            is_active=True,
            agency_id=self._agency_id,
        )
        self._repo.create(user)
        self._db.commit()
        self._db.refresh(user)

        log_action(
            self._db,
            actor,
            "create_user",
            "user",
            user.id,
            f"Created user {user.email} with role {user.role.value}",
        )
        return user

    def update(self, user_id: int, payload: UserUpdate, actor: User) -> User:
        """Update an existing user."""
        user = self.get_or_404(user_id)

        if user.id == actor.id and payload.role is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot change your own role",
            )

        data = payload.model_dump(exclude_unset=True)

        # Role change guard
        if "role" in data:
            new_role = UserRole(data["role"])
            if role_level(new_role) > role_level(actor.role):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot assign a role higher than your own",
                )
            data["role"] = new_role

        # Password hashing
        if "password" in data:
            data["hashed_password"] = hash_password(data.pop("password"))

        old_values = {k: getattr(user, k, None) for k in data.keys()}
        self._repo.update(user, **data)
        self._db.commit()
        self._db.refresh(user)

        log_action(
            self._db,
            actor,
            "update_user",
            "user",
            user.id,
            f"Updated user {user.email}",
            old_value=old_values,
            new_value=data,
        )
        return user

    def soft_delete(self, user_id: int, actor: User) -> None:
        """Soft-delete a user. Prevents self-deletion."""
        if user_id == actor.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete yourself",
            )
        user = self.get_or_404(user_id)
        self._repo.soft_delete(user)
        self._db.commit()

        log_action(
            self._db,
            actor,
            "delete_user",
            "user",
            user.id,
            f"Soft-deleted user {user.email}",
        )


def role_level(role: UserRole | str) -> int:
    """Numeric privilege level for comparison."""
    if isinstance(role, str):
        role = UserRole(role)
    return role.level
