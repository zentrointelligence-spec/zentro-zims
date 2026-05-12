"""User model with multi-tenant RBAC roles.

Role hierarchy (highest → lowest):
  super_admin > agency_admin > agent > staff

Design decisions:
1. ``UserRole`` is a string enum stored as native PostgreSQL ENUM.
   This gives type safety + readable values without integer indirection.
2. ``agency_id`` is NOT NULL for all roles except super_admin, which
   conceptually spans all agencies. In practice, super_admin records
   still store agency_id=0 (or a dedicated system agency) to keep the
   foreign-key constraint simple.
3. ``deleted_at`` enables soft-delete for GDPR / audit compliance.
   Hard deletes are prohibited by the repository layer.
4. ``last_login_at`` helps detect stale accounts and powers analytics.
"""
from __future__ import annotations

import enum
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.agency import Agency


class UserRole(str, enum.Enum):
    """RBAC roles ordered by privilege level.

    We attach numeric values so that ``role_level()`` comparisons work
    without hard-coding magic integers throughout the codebase.
    """

    SUPER_ADMIN = "super_admin"    # Platform operator — cross-tenant access
    AGENCY_ADMIN = "agency_admin"  # Agency owner/manager — full tenant control
    AGENT = "agent"                # Sales agent — CRUD on CRM data
    STAFF = "staff"                # Read-only / limited write access

    @property
    def level(self) -> int:
        """Numeric privilege level (higher = more powerful)."""
        return _ROLE_LEVELS[self]


# Global lookup for fast comparison without constructing enum instances
_ROLE_LEVELS: dict[UserRole, int] = {
    UserRole.SUPER_ADMIN: 40,
    UserRole.AGENCY_ADMIN: 30,
    UserRole.AGENT: 20,
    UserRole.STAFF: 10,
}


def role_level(role: UserRole | str) -> int:
    """Return the numeric privilege level for a role."""
    if isinstance(role, str):
        role = UserRole(role)
    return role.level


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True, index=True
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"),
        nullable=False,
        default=UserRole.AGENT,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Tenant isolation
    agency_id: Mapped[int] = mapped_column(
        ForeignKey("agencies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Operational timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Soft delete (GDPR / audit compliance)
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )

    # Login security
    failed_login_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    locked_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    agency: Mapped["Agency"] = relationship("Agency", back_populates="users")

    @property
    def is_locked(self) -> bool:
        """True if the account is temporarily locked due to failed logins."""
        if self.locked_until is None:
            return False
        # SQLite stores naive datetimes; PostgreSQL stores aware datetimes.
        # We always store UTC, so compare consistently.
        if self.locked_until.tzinfo is None:
            now = datetime.utcnow()
        else:
            now = datetime.now(tz=timezone.utc)
        return now < self.locked_until

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None

    def has_role(self, min_role: UserRole) -> bool:
        """Check if user has at least ``min_role`` privilege."""
        return role_level(self.role) >= role_level(min_role)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<User id={self.id} email={self.email!r} role={self.role.value}>"
