"""Policy repository with search, filters, and renewal queries.

Follows the same pattern as ``CustomerRepository`` for consistency.
"""
from __future__ import annotations

from datetime import date, timedelta
from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.policy import Policy, PolicyNote, PolicyStatus
from app.repositories.base import BaseRepository


class PolicyRepository(BaseRepository[Policy]):
    """Data access layer for policies."""

    model = Policy

    def get_with_notes(self, policy_id: int, agency_id: int) -> Policy | None:
        """Fetch a policy with note timeline eagerly loaded."""
        stmt = (
            select(Policy)
            .where(
                Policy.id == policy_id,
                Policy.agency_id == agency_id,
                Policy.deleted_at.is_(None),
            )
            .options(joinedload(Policy.policy_notes))
            .options(joinedload(Policy.customer))
        )
        return self._db.execute(stmt).unique().scalar_one_or_none()

    def get_by_policy_number(
        self, policy_number: str, agency_id: int
    ) -> Policy | None:
        """Fetch a policy by its unique policy number within an agency."""
        return self.get_by(
            policy_number=policy_number,
            agency_id=agency_id,
        )

    def list_with_filters(
        self,
        *,
        agency_id: int,
        search: str | None = None,
        status: PolicyStatus | None = None,
        payment_status: str | None = None,
        customer_id: int | None = None,
        policy_type: str | None = None,
        expiry_from: date | None = None,
        expiry_to: date | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Policy], int]:
        """Return (policies, total_count) matching all filters."""
        stmt = select(Policy).where(
            Policy.agency_id == agency_id, Policy.deleted_at.is_(None)
        )

        if search:
            pattern = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    Policy.policy_number.ilike(pattern),
                    Policy.policy_type.ilike(pattern),
                    Policy.insurer_name.ilike(pattern),
                )
            )

        if status is not None:
            stmt = stmt.where(Policy.status == status)

        if payment_status is not None:
            stmt = stmt.where(Policy.payment_status == payment_status)

        if customer_id is not None:
            stmt = stmt.where(Policy.customer_id == customer_id)

        if policy_type is not None:
            stmt = stmt.where(Policy.policy_type == policy_type)

        if expiry_from is not None:
            stmt = stmt.where(Policy.expiry_date >= expiry_from)
        if expiry_to is not None:
            stmt = stmt.where(Policy.expiry_date <= expiry_to)

        # Sorting
        sort_col = getattr(Policy, sort_by, Policy.created_at)
        if sort_order == "desc":
            stmt = stmt.order_by(sort_col.desc(), Policy.id.desc())
        else:
            stmt = stmt.order_by(sort_col.asc(), Policy.id.asc())

        # Count
        count_stmt = select(func.count()).select_from(
            stmt.order_by(None).subquery()
        )
        total: int = self._db.execute(count_stmt).scalar() or 0

        # Page
        offset = (page - 1) * page_size
        rows = self._db.execute(stmt.limit(page_size).offset(offset)).scalars().all()
        return list(rows), total

    def list_upcoming_renewals(
        self,
        *,
        agency_id: int,
        days: int = 30,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Policy], int]:
        """Return policies with expiry_date within the next N days.

        Used by the renewal scheduler and the upcoming-renewals API.
        """
        today = date.today()
        window_end = today + timedelta(days=days)

        stmt = (
            select(Policy)
            .where(
                Policy.agency_id == agency_id,
                Policy.deleted_at.is_(None),
                Policy.status.in_([PolicyStatus.ACTIVE, PolicyStatus.RENEWAL_DUE]),
                Policy.expiry_date >= today,
                Policy.expiry_date <= window_end,
            )
            .order_by(Policy.expiry_date.asc(), Policy.id.asc())
        )

        count_stmt = select(func.count()).select_from(
            stmt.order_by(None).subquery()
        )
        total: int = self._db.execute(count_stmt).scalar() or 0
        offset = (page - 1) * page_size
        rows = self._db.execute(stmt.limit(page_size).offset(offset)).scalars().all()
        return list(rows), total

    def list_expired_policies(
        self,
        *,
        agency_id: int,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Policy], int]:
        """Return policies that have passed their expiry_date but are not yet EXPIRED.

        Used by the renewal scheduler to auto-mark expired policies.
        """
        today = date.today()

        stmt = (
            select(Policy)
            .where(
                Policy.agency_id == agency_id,
                Policy.deleted_at.is_(None),
                Policy.status.in_([PolicyStatus.ACTIVE, PolicyStatus.RENEWAL_DUE]),
                Policy.expiry_date < today,
            )
            .order_by(Policy.expiry_date.asc(), Policy.id.asc())
        )

        count_stmt = select(func.count()).select_from(
            stmt.order_by(None).subquery()
        )
        total: int = self._db.execute(count_stmt).scalar() or 0
        offset = (page - 1) * page_size
        rows = self._db.execute(stmt.limit(page_size).offset(offset)).scalars().all()
        return list(rows), total


class PolicyNoteRepository(BaseRepository[PolicyNote]):
    """Data access layer for policy notes."""

    model = PolicyNote

    def list_for_policy(self, policy_id: int, agency_id: int) -> list[PolicyNote]:
        """Fetch all notes for a policy, newest first."""
        return self.list(
            policy_id=policy_id,
            agency_id=agency_id,
            order_by=[PolicyNote.created_at.desc(), PolicyNote.id.desc()],
        )
