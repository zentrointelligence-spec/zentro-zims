"""Customer repository with search, filters, and KYC queries.

Follows the same pattern as ``LeadRepository`` for consistency.
"""
from __future__ import annotations

from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.customer import Customer, CustomerNote
from app.repositories.base import BaseRepository


class CustomerRepository(BaseRepository[Customer]):
    """Data access layer for customers."""

    model = Customer

    def get_with_notes(self, customer_id: int, agency_id: int) -> Customer | None:
        """Fetch a customer with note timeline eagerly loaded."""
        stmt = (
            select(Customer)
            .where(
                Customer.id == customer_id,
                Customer.agency_id == agency_id,
                Customer.deleted_at.is_(None),
            )
            .options(joinedload(Customer.customer_notes))
            .options(joinedload(Customer.dependents))
        )
        return self._db.execute(stmt).unique().scalar_one_or_none()

    def list_with_filters(
        self,
        *,
        agency_id: int,
        search: str | None = None,
        kyc_verified: bool | None = None,
        risk_profile: str | None = None,
        preferred_contact: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Customer], int]:
        """Return (customers, total_count) matching all filters."""
        stmt = select(Customer).where(
            Customer.agency_id == agency_id, Customer.deleted_at.is_(None)
        )

        if search:
            pattern = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    Customer.name.ilike(pattern),
                    Customer.phone.ilike(pattern),
                    Customer.email.ilike(pattern),
                    Customer.id_number.ilike(pattern),
                )
            )

        if kyc_verified is not None:
            stmt = stmt.where(Customer.kyc_verified.is_(kyc_verified))

        if risk_profile is not None:
            stmt = stmt.where(Customer.risk_profile == risk_profile)

        if preferred_contact is not None:
            stmt = stmt.where(Customer.preferred_contact == preferred_contact)

        if date_from is not None:
            stmt = stmt.where(Customer.created_at >= date_from)
        if date_to is not None:
            stmt = stmt.where(Customer.created_at <= date_to)

        # Sorting
        sort_col = getattr(Customer, sort_by, Customer.created_at)
        if sort_order == "desc":
            stmt = stmt.order_by(sort_col.desc(), Customer.id.desc())
        else:
            stmt = stmt.order_by(sort_col.asc(), Customer.id.asc())

        # Count
        count_stmt = select(func.count()).select_from(
            stmt.order_by(None).subquery()
        )
        total: int = self._db.execute(count_stmt).scalar() or 0

        # Page
        offset = (page - 1) * page_size
        rows = self._db.execute(stmt.limit(page_size).offset(offset)).scalars().all()
        return list(rows), total


class CustomerNoteRepository(BaseRepository[CustomerNote]):
    """Data access layer for customer notes."""

    model = CustomerNote

    def list_for_customer(self, customer_id: int, agency_id: int) -> list[CustomerNote]:
        """Fetch all notes for a customer, newest first."""
        return self.list(
            customer_id=customer_id,
            agency_id=agency_id,
            order_by=[CustomerNote.created_at.desc(), CustomerNote.id.desc()],
        )
