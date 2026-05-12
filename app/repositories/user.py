"""User repository with tenant-safe queries and role helpers."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """Data access layer for users.

    Guarantees:
    - Every list query is scoped to the caller's agency_id.
    - Soft-deleted users are excluded by default.
    - Email lookups are case-insensitive (store lowercase, query lowercase).
    """

    model = User

    def get_by_email(
        self, email: str, agency_id: int | None = None, include_deleted: bool = False
    ) -> User | None:
        """Lookup by email (case-insensitive)."""
        return self.get_by(
            email=email.lower(),
            agency_id=agency_id,
            include_deleted=include_deleted,
        )

    def list_by_role(
        self,
        role: UserRole,
        *,
        agency_id: int | None = None,
        include_deleted: bool = False,
    ) -> list[User]:
        """List users filtered by role within an agency."""
        return self.list(
            role=role,
            agency_id=agency_id,
            include_deleted=include_deleted,
        )

    def exists_in_agency(self, email: str, agency_id: int) -> bool:
        """True if an active, non-deleted user with this email exists in agency."""
        return self.get_by_email(email, agency_id=agency_id) is not None
