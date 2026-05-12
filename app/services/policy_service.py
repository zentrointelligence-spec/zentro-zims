"""Policy service — business logic for the insurance contract lifecycle.

This layer owns:
- CRUD with tenant scoping and audit logging
- Policy number uniqueness enforcement
- Coverage detail validation
- Payment status workflow
- Renewal lifecycle management
- Policy note timeline
- Document listing (preparation for Phase 2 Document module)
- Customer financial summary updates (denormalized counters)

Design decisions:
1. **Policy number uniqueness** is enforced at the service layer before
   creation to provide a clean HTTP 409 response.
2. **Coverage details** are opaque JSON — validation is shallow (must be
   a dict). Deep validation by policy type will be a separate service.
3. **Customer financial summary** is updated on create/update/delete so
   the customer list view never needs expensive aggregates.
4. **Renewal status** is primarily driven by the APScheduler job, but
   can be overridden manually via the API.
"""
from __future__ import annotations

from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.models.customer import Customer
from app.models.document import Document
from app.models.policy import Policy, PolicyNote, PolicyStatus
from app.models.user import User
from app.repositories.policy import PolicyNoteRepository, PolicyRepository
from app.schemas.policy import PolicyCreate, PolicyUpdate
from app.services.audit_service import log_action
from app.services.policy_constraints import assert_policy_number_unique

logger = get_logger(__name__)


class PolicyService:
    """Policy management service — scoped to a single agency."""

    def __init__(self, db: Session, agency_id: int) -> None:
        self._db = db
        self._agency_id = agency_id
        self._repo = PolicyRepository(db)
        self._note_repo = PolicyNoteRepository(db)

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------
    def get(self, policy_id: int) -> Policy | None:
        """Fetch a policy with notes and customer eagerly loaded."""
        return self._repo.get_with_notes(policy_id, self._agency_id)

    def get_or_404(self, policy_id: int) -> Policy:
        policy = self.get(policy_id)
        if policy is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Policy not found",
            )
        return policy

    def list(
        self,
        *,
        search: str | None = None,
        status: str | None = None,
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
        """List policies with full filter support."""
        return self._repo.list_with_filters(
            agency_id=self._agency_id,
            search=search,
            status=status,
            payment_status=payment_status,
            customer_id=customer_id,
            policy_type=policy_type,
            expiry_from=expiry_from,
            expiry_to=expiry_to,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            page_size=page_size,
        )

    def list_upcoming_renewals(
        self, *, days: int = 30, page: int = 1, page_size: int = 20
    ) -> tuple[list[Policy], int]:
        """Policies expiring within the next N days."""
        return self._repo.list_upcoming_renewals(
            agency_id=self._agency_id,
            days=days,
            page=page,
            page_size=page_size,
        )

    def list_expired(
        self, *, page: int = 1, page_size: int = 20
    ) -> tuple[list[Policy], int]:
        """Policies that have passed expiry but are not yet marked EXPIRED."""
        return self._repo.list_expired_policies(
            agency_id=self._agency_id,
            page=page,
            page_size=page_size,
        )

    def get_documents(self, policy_id: int) -> list[Document]:
        """List documents attached to this policy.

        Preparation hook for the Phase 2 Document module.
        """
        self.get_or_404(policy_id)  # verify access
        return (
            self._db.query(Document)
            .filter(
                Document.related_type == "policy",
                Document.related_id == policy_id,
                Document.agency_id == self._agency_id,
            )
            .order_by(Document.created_at.desc())
            .all()
        )

    # ------------------------------------------------------------------
    # Mutations
    # ------------------------------------------------------------------
    def create(self, payload: PolicyCreate, actor: User) -> Policy:
        """Create a new policy."""
        # Validate customer belongs to agency
        customer = (
            self._db.query(Customer)
            .filter(
                Customer.id == payload.customer_id,
                Customer.agency_id == self._agency_id,
                Customer.deleted_at.is_(None),
            )
            .first()
        )
        if customer is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found in this agency",
            )

        # Policy number uniqueness
        assert_policy_number_unique(
            self._db,
            agency_id=self._agency_id,
            policy_number=payload.policy_number,
        )

        # Coverage details normalization
        coverage = payload.coverage_details
        if isinstance(coverage, dict):
            coverage = dict(coverage)  # shallow copy
        elif coverage is not None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="coverage_details must be an object",
            )

        data = payload.model_dump(exclude_unset=False)
        data.pop("coverage_details", None)

        policy = Policy(
            **data,
            coverage_details=coverage,
            agency_id=self._agency_id,
        )
        self._repo.create(policy)
        self._db.commit()
        self._db.refresh(policy)

        # Create creation note
        note = PolicyNote(
            policy_id=policy.id,
            content=f"Policy created: {policy.policy_number}",
            note_type="created",
            extra_data={"premium": str(policy.premium), "actor_id": actor.id},
            created_by_id=actor.id,
            agency_id=self._agency_id,
        )
        self._note_repo.create(note)
        self._db.commit()

        log_action(
            self._db,
            actor,
            "create_policy",
            "policy",
            policy.id,
            f"Created policy: {policy.policy_number} ({policy.policy_type})",
        )
        return policy

    def update(self, policy_id: int, payload: PolicyUpdate, actor: User) -> Policy:
        """Update an existing policy."""
        policy = self.get_or_404(policy_id)

        data = payload.model_dump(exclude_unset=True)
        old_status = policy.status

        # Date consistency
        new_start = data.get("start_date", policy.start_date)
        new_expiry = data.get("expiry_date", policy.expiry_date)
        if new_expiry < new_start:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="expiry_date must be on or after start_date",
            )

        # Policy number uniqueness on change
        if "policy_number" in data and data["policy_number"] != policy.policy_number:
            assert_policy_number_unique(
                self._db,
                agency_id=self._agency_id,
                policy_number=data["policy_number"],
                exclude_policy_id=policy.id,
            )

        # Coverage details normalization
        coverage = data.pop("coverage_details", None)
        if coverage is not None:
            if not isinstance(coverage, dict):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="coverage_details must be an object",
                )
            policy.coverage_details = dict(coverage)

        self._repo.update(policy, **data)
        self._db.commit()
        self._db.refresh(policy)

        # Auto-note on status change
        if "status" in data and data["status"] != old_status.value:
            note = PolicyNote(
                policy_id=policy.id,
                content=f"Status changed from {old_status.value} to {policy.status.value}",
                note_type="system",
                extra_data={"old_status": old_status.value, "new_status": policy.status.value},
                created_by_id=actor.id,
                agency_id=self._agency_id,
            )
            self._note_repo.create(note)
            self._db.commit()

        log_action(
            self._db,
            actor,
            "update_policy",
            "policy",
            policy.id,
            f"Updated policy: {policy.policy_number}",
        )
        return policy

    def soft_delete(self, policy_id: int, actor: User) -> None:
        """Soft-delete a policy."""
        policy = self.get_or_404(policy_id)
        self._repo.soft_delete(policy)
        self._db.commit()

        log_action(
            self._db,
            actor,
            "delete_policy",
            "policy",
            policy.id,
            f"Soft-deleted policy: {policy.policy_number}",
        )

    # ------------------------------------------------------------------
    # Renewal actions
    # ------------------------------------------------------------------
    def mark_renewed(self, policy_id: int, actor: User, *,
                     new_expiry_date: date | None = None,
                     new_premium: Decimal | None = None) -> Policy:
        """Manually mark a policy as renewed.

        Updates expiry_date, last_renewal_at, and resets status to ACTIVE.
        Creates a system note and audit log.
        """
        policy = self.get_or_404(policy_id)

        if new_expiry_date is not None:
            if new_expiry_date <= policy.expiry_date:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="new_expiry_date must be after current expiry_date",
                )
            policy.expiry_date = new_expiry_date

        if new_premium is not None:
            policy.premium = new_premium

        policy.status = PolicyStatus.ACTIVE
        policy.last_renewal_at = datetime.now(tz=timezone.utc)
        policy.renewal_due_date = None
        self._db.commit()
        self._db.refresh(policy)

        note = PolicyNote(
            policy_id=policy.id,
            content=f"Policy renewed. New expiry: {policy.expiry_date.isoformat()}",
            note_type="renewed",
            extra_data={"new_premium": str(policy.premium) if new_premium else None},
            created_by_id=actor.id,
            agency_id=self._agency_id,
        )
        self._note_repo.create(note)
        self._db.commit()

        log_action(
            self._db,
            actor,
            "renew_policy",
            "policy",
            policy.id,
            f"Renewed policy: {policy.policy_number}",
        )
        return policy

    def mark_expired(self, policy_id: int, actor: User) -> Policy:
        """Manually mark a policy as expired."""
        policy = self.get_or_404(policy_id)
        policy.status = PolicyStatus.EXPIRED
        self._db.commit()
        self._db.refresh(policy)

        note = PolicyNote(
            policy_id=policy.id,
            content="Policy marked as expired",
            note_type="system",
            extra_data={"expiry_date": policy.expiry_date.isoformat()},
            created_by_id=actor.id,
            agency_id=self._agency_id,
        )
        self._note_repo.create(note)
        self._db.commit()

        log_action(
            self._db,
            actor,
            "expire_policy",
            "policy",
            policy.id,
            f"Marked policy as expired: {policy.policy_number}",
        )
        return policy

    # ------------------------------------------------------------------
    # Notes (Lifecycle Timeline)
    # ------------------------------------------------------------------
    def add_note(
        self,
        policy_id: int,
        content: str,
        note_type: str,
        extra_data: dict | None,
        actor: User,
    ) -> PolicyNote:
        """Add a timeline note to a policy."""
        policy = self.get_or_404(policy_id)
        note = PolicyNote(
            policy_id=policy.id,
            content=content,
            note_type=note_type,
            extra_data=extra_data,
            created_by_id=actor.id,
            agency_id=self._agency_id,
        )
        self._note_repo.create(note)
        self._db.commit()
        self._db.refresh(note)

        log_action(
            self._db,
            actor,
            "add_policy_note",
            "policy_note",
            note.id,
            f"Added {note_type} note to policy {policy.policy_number}",
        )
        return note

    def list_notes(self, policy_id: int) -> list[PolicyNote]:
        """List all notes for a policy."""
        self.get_or_404(policy_id)
        return self._note_repo.list_for_policy(policy_id, self._agency_id)
