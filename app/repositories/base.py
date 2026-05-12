"""Generic repository base class with built-in tenant isolation.

Design decisions:
1. **Repository pattern** decouples data access from business logic and routes.
   This makes unit testing trivial (swap in a memory repo) and allows
   migrating from SQLAlchemy to another ORM without touching routes.
2. **Tenant filtering is automatic**: all ``list`` and ``get`` operations
   inject ``agency_id = ?`` unless explicitly overridden.
3. **Soft deletes are the default**: ``list()`` filters ``deleted_at IS NULL``.
   Use ``list(include_deleted=True)`` to see soft-deleted rows.
4. **No commit in repositories**: the caller (service/route) owns the
   transaction boundary. Repositories only add/flush/query.
"""
from __future__ import annotations

from typing import Any, Generic, TypeVar

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.logging import get_logger

logger = get_logger(__name__)

ModelType = TypeVar("ModelType")


class BaseRepository(Generic[ModelType]):
    """Generic CRUD repository with agency_id scoping and soft-delete support.

    Subclass and set ``model``::

        class UserRepository(BaseRepository[User]):
            model = User
    """

    model: type[ModelType]

    def __init__(self, db: Session) -> None:
        self._db = db

    # ------------------------------------------------------------------
    # Core lookups
    # ------------------------------------------------------------------
    def get(self, obj_id: int, agency_id: int | None = None) -> ModelType | None:
        """Fetch by primary key, optionally scoped to agency."""
        stmt = select(self.model).where(self.model.id == obj_id)  # type: ignore[attr-defined]
        if agency_id is not None:
            stmt = stmt.where(self.model.agency_id == agency_id)  # type: ignore[attr-defined]
        return self._db.execute(stmt).scalar_one_or_none()

    def get_by(
        self,
        *,
        agency_id: int | None = None,
        include_deleted: bool = False,
        **filters: Any,
    ) -> ModelType | None:
        """Fetch first row matching arbitrary column filters."""
        stmt = select(self.model)
        for col, val in filters.items():
            if not hasattr(self.model, col):
                raise AttributeError(f"{self.model.__name__} has no column '{col}'")
            stmt = stmt.where(getattr(self.model, col) == val)
        if agency_id is not None:
            stmt = stmt.where(self.model.agency_id == agency_id)  # type: ignore[attr-defined]
        if not include_deleted and hasattr(self.model, "deleted_at"):
            stmt = stmt.where(self.model.deleted_at.is_(None))  # type: ignore[attr-defined]
        return self._db.execute(stmt).scalar_one_or_none()

    # ------------------------------------------------------------------
    # List / pagination
    # ------------------------------------------------------------------
    def list(
        self,
        *,
        agency_id: int | None = None,
        include_deleted: bool = False,
        order_by: Any | None = None,
        **filters: Any,
    ) -> list[ModelType]:
        """List rows, auto-filtered by agency and soft-delete."""
        stmt = select(self.model)
        for col, val in filters.items():
            stmt = stmt.where(getattr(self.model, col) == val)
        if agency_id is not None:
            stmt = stmt.where(self.model.agency_id == agency_id)  # type: ignore[attr-defined]
        if not include_deleted and hasattr(self.model, "deleted_at"):
            stmt = stmt.where(self.model.deleted_at.is_(None))  # type: ignore[attr-defined]
        if order_by is not None:
            if isinstance(order_by, (list, tuple)):
                stmt = stmt.order_by(*order_by)
            else:
                stmt = stmt.order_by(order_by)
        return list(self._db.execute(stmt).scalars().all())

    # ------------------------------------------------------------------
    # Mutations
    # ------------------------------------------------------------------
    def create(self, obj: ModelType) -> ModelType:
        """Add a new instance to the session."""
        self._db.add(obj)
        self._db.flush()
        return obj

    def update(self, obj: ModelType, **data: Any) -> ModelType:
        """Update instance attributes and flush."""
        for field, value in data.items():
            if hasattr(obj, field):
                setattr(obj, field, value)
        self._db.flush()
        return obj

    def soft_delete(self, obj: ModelType) -> ModelType:
        """Set ``deleted_at`` to now. Raises if model lacks the column."""
        if not hasattr(obj, "deleted_at"):
            raise AttributeError(f"{self.model.__name__} does not support soft delete")
        from datetime import datetime, timezone

        obj.deleted_at = datetime.now(tz=timezone.utc)  # type: ignore[attr-defined]
        self._db.flush()
        return obj

    def hard_delete(self, obj: ModelType) -> None:
        """Physically remove a row. Use sparingly (GDPR erasure only)."""
        self._db.delete(obj)
        self._db.flush()

    def count(
        self,
        *,
        agency_id: int | None = None,
        include_deleted: bool = False,
        **filters: Any,
    ) -> int:
        """Count rows matching filters."""
        from sqlalchemy import func as sa_func

        stmt = select(sa_func.count(self.model.id))  # type: ignore[attr-defined]
        for col, val in filters.items():
            stmt = stmt.where(getattr(self.model, col) == val)
        if agency_id is not None:
            stmt = stmt.where(self.model.agency_id == agency_id)  # type: ignore[attr-defined]
        if not include_deleted and hasattr(self.model, "deleted_at"):
            stmt = stmt.where(self.model.deleted_at.is_(None))  # type: ignore[attr-defined]
        return self._db.execute(stmt).scalar() or 0
