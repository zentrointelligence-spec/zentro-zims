"""Lead repository with advanced filtering, search, and cursor pagination.

Design decisions:
1. **JSON tag filtering** uses PostgreSQL's jsonb containment operator when
   available, falling back to string LIKE for SQLite.
2. **Search** uses ILIKE on name, phone, and email — fast enough for
   <100k rows. For larger scale, migrate to PostgreSQL full-text search
   (tsvector) or Elasticsearch (Phase 4).
3. **Cursor pagination** is implemented via ``id < cursor`` (descending)
   which is index-friendly and stable under concurrent inserts.
4. **Kanban summary** uses a single GROUP BY query instead of N separate
   count queries.
"""
from __future__ import annotations

from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.lead import Lead, LeadNote, LeadStatus
from app.repositories.base import BaseRepository


class LeadRepository(BaseRepository[Lead]):
    """Data access layer for leads."""

    model = Lead

    # ------------------------------------------------------------------
    # Core lookups
    # ------------------------------------------------------------------
    def get_with_notes(self, lead_id: int, agency_id: int) -> Lead | None:
        """Fetch a lead with its note timeline eagerly loaded."""
        stmt = (
            select(Lead)
            .where(
                Lead.id == lead_id,
                Lead.agency_id == agency_id,
                Lead.deleted_at.is_(None),
            )
            .options(joinedload(Lead.lead_notes))
        )
        return self._db.execute(stmt).unique().scalar_one_or_none()

    # ------------------------------------------------------------------
    # List with filters + offset pagination
    # ------------------------------------------------------------------
    def list_with_filters(
        self,
        *,
        agency_id: int,
        status: LeadStatus | None = None,
        search: str | None = None,
        tags: list[str] | None = None,
        assigned_user_id: int | None = None,
        source: str | None = None,
        min_score: float | None = None,
        max_score: float | None = None,
        date_from: Any | None = None,
        date_to: Any | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Lead], int]:
        """Return (leads, total_count) matching all filters."""
        stmt = self._build_filtered_stmt(
            agency_id=agency_id,
            status=status,
            search=search,
            tags=tags,
            assigned_user_id=assigned_user_id,
            source=source,
            min_score=min_score,
            max_score=max_score,
            date_from=date_from,
            date_to=date_to,
        )

        # Sorting
        sort_col = getattr(Lead, sort_by, Lead.created_at)
        if sort_order == "desc":
            stmt = stmt.order_by(sort_col.desc(), Lead.id.desc())
        else:
            stmt = stmt.order_by(sort_col.asc(), Lead.id.asc())

        # Count
        count_stmt = select(func.count()).select_from(
            stmt.order_by(None).subquery()
        )
        total: int = self._db.execute(count_stmt).scalar() or 0

        # Page
        offset = (page - 1) * page_size
        rows = self._db.execute(stmt.limit(page_size).offset(offset)).scalars().all()
        return list(rows), total

    # ------------------------------------------------------------------
    # Cursor pagination (keyset)
    # ------------------------------------------------------------------
    def list_with_cursor(
        self,
        *,
        agency_id: int,
        cursor: int | None = None,
        page_size: int = 20,
        status: LeadStatus | None = None,
        search: str | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> tuple[list[Lead], int | None]:
        """Cursor-based pagination for infinite scroll / large datasets.

        Returns:
            (leads, next_cursor) — next_cursor is None when no more pages.
        """
        stmt = self._build_filtered_stmt(
            agency_id=agency_id, status=status, search=search
        )
        sort_col = getattr(Lead, sort_by, Lead.created_at)

        if cursor is not None:
            if sort_order == "desc":
                stmt = stmt.where(Lead.id < cursor)
            else:
                stmt = stmt.where(Lead.id > cursor)

        if sort_order == "desc":
            stmt = stmt.order_by(sort_col.desc(), Lead.id.desc())
        else:
            stmt = stmt.order_by(sort_col.asc(), Lead.id.asc())

        rows = list(
            self._db.execute(stmt.limit(page_size + 1)).scalars().all()
        )
        has_more = len(rows) > page_size
        if has_more:
            rows = rows[:page_size]
            next_cursor = rows[-1].id if rows else None
        else:
            next_cursor = None
        return rows, next_cursor

    # ------------------------------------------------------------------
    # Kanban
    # ------------------------------------------------------------------
    def kanban_summary(
        self, agency_id: int, limit_per_column: int = 10
    ) -> dict[str, dict[str, Any]]:
        """Return leads grouped by status for Kanban boards.

        Returns a dict keyed by status value::

            {
                "new": {"count": 5, "leads": [...]},
                "contacted": {"count": 3, "leads": [...]},
                ...
            }
        """
        result: dict[str, dict[str, Any]] = {
            s.value: {"count": 0, "leads": []} for s in LeadStatus
        }

        # Counts per status
        count_stmt = (
            select(Lead.status, func.count(Lead.id))
            .where(Lead.agency_id == agency_id, Lead.deleted_at.is_(None))
            .group_by(Lead.status)
        )
        for status_val, count in self._db.execute(count_stmt).all():
            result[status_val]["count"] = count

        # Preview leads per status (latest first)
        for status in LeadStatus:
            stmt = (
                select(Lead)
                .where(
                    Lead.agency_id == agency_id,
                    Lead.status == status,
                    Lead.deleted_at.is_(None),
                )
                .order_by(Lead.created_at.desc())
                .limit(limit_per_column)
            )
            result[status.value]["leads"] = list(
                self._db.execute(stmt).scalars().all()
            )

        return result

    # ------------------------------------------------------------------
    # Internal: build filtered SELECT
    # ------------------------------------------------------------------
    def _build_filtered_stmt(
        self,
        *,
        agency_id: int,
        status: LeadStatus | None = None,
        search: str | None = None,
        tags: list[str] | None = None,
        assigned_user_id: int | None = None,
        source: str | None = None,
        min_score: float | None = None,
        max_score: float | None = None,
        date_from: Any | None = None,
        date_to: Any | None = None,
    ) -> select:
        """Build a filtered SELECT statement for leads."""
        stmt = select(Lead).where(
            Lead.agency_id == agency_id, Lead.deleted_at.is_(None)
        )

        if status is not None:
            stmt = stmt.where(Lead.status == status)

        if assigned_user_id is not None:
            stmt = stmt.where(Lead.assigned_user_id == assigned_user_id)

        if source is not None:
            stmt = stmt.where(Lead.source.ilike(f"%{source}%"))

        if search:
            pattern = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    Lead.name.ilike(pattern),
                    Lead.phone.ilike(pattern),
                    Lead.email.ilike(pattern),
                )
            )

        if tags:
            # Cross-database JSON tag filtering
            dialect = self._db.bind.dialect.name if self._db.bind else "sqlite"
            if dialect == "postgresql":
                from sqlalchemy.dialects.postgresql import array as pg_array

                stmt = stmt.where(Lead.tags.op("&&")(pg_array(tags)))
            else:
                # SQLite fallback: string containment check
                tag_conditions = [
                    Lead.tags.ilike(f'%"{tag.lower().strip()}"%')
                    for tag in tags
                ]
                if tag_conditions:
                    stmt = stmt.where(or_(*tag_conditions))

        if min_score is not None:
            stmt = stmt.where(Lead.lead_score >= min_score)
        if max_score is not None:
            stmt = stmt.where(Lead.lead_score <= max_score)

        if date_from is not None:
            stmt = stmt.where(Lead.created_at >= date_from)
        if date_to is not None:
            stmt = stmt.where(Lead.created_at <= date_to)

        return stmt


class LeadNoteRepository(BaseRepository[LeadNote]):
    """Data access layer for lead notes."""

    model = LeadNote

    def list_for_lead(self, lead_id: int, agency_id: int) -> list[LeadNote]:
        """Fetch all notes for a lead, newest first."""
        return self.list(
            lead_id=lead_id,
            agency_id=agency_id,
            order_by=[LeadNote.created_at.desc(), LeadNote.id.desc()],
        )
