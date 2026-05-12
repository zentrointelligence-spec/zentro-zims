"""Customer service — business logic for the insured entity lifecycle.

This layer owns:
- CRUD with tenant scoping and audit logging
- KYC verification workflow
- Communication timeline (notes)
- Dependent management
- Document listing (preparation for Phase 2 Document module)
- Lead conversion helper

Design decisions:
1. **KYC is a workflow, not a state machine**. ``kyc_verified`` is a boolean
   flag; complex multi-step KYC (document upload, face match, sanctions check)
   will be a separate service in Phase 3.
2. **Dependents are managed through CustomerService** because they have no
   meaning outside a customer context. This keeps the API surface small.
3. **Document listing queries the existing Document table** via
   ``related_type="customer"``. No new document functionality is added —
   this is pure preparation for the Document module.
4. **Lead conversion** creates a customer from a lead and links them via
   ``lead_id``. The actual endpoint lives in ``leads.py``; this service
   provides the reusable business logic.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.models.customer import Customer, CustomerNote
from app.models.dependent import Dependent
from app.models.document import Document
from app.models.lead import Lead
from app.models.user import User
from app.repositories.customer import CustomerNoteRepository, CustomerRepository
from app.schemas.customer import CustomerCreate, CustomerUpdate
from app.schemas.dependent import DependentCreate
from app.services.audit_service import log_action

logger = get_logger(__name__)


class CustomerService:
    """Customer management service — scoped to a single agency."""

    def __init__(self, db: Session, agency_id: int) -> None:
        self._db = db
        self._agency_id = agency_id
        self._repo = CustomerRepository(db)
        self._note_repo = CustomerNoteRepository(db)

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------
    def get(self, customer_id: int) -> Customer | None:
        """Fetch a customer with notes and dependents eagerly loaded."""
        return self._repo.get_with_notes(customer_id, self._agency_id)

    def get_or_404(self, customer_id: int) -> Customer:
        customer = self.get(customer_id)
        if customer is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found",
            )
        return customer

    def list(
        self,
        *,
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
        """List customers with full filter support."""
        return self._repo.list_with_filters(
            agency_id=self._agency_id,
            search=search,
            kyc_verified=kyc_verified,
            risk_profile=risk_profile,
            preferred_contact=preferred_contact,
            date_from=date_from,
            date_to=date_to,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            page_size=page_size,
        )

    def get_documents(self, customer_id: int) -> list[Document]:
        """List documents attached to this customer.

        Preparation hook for the Phase 2 Document module.
        """
        self.get_or_404(customer_id)  # verify access
        return (
            self._db.query(Document)
            .filter(
                Document.related_type == "customer",
                Document.related_id == customer_id,
                Document.agency_id == self._agency_id,
            )
            .order_by(Document.created_at.desc())
            .all()
        )

    # ------------------------------------------------------------------
    # Mutations
    # ------------------------------------------------------------------
    def create(self, payload: CustomerCreate, actor: User) -> Customer:
        """Create a new customer."""
        customer = Customer(
            **payload.model_dump(exclude_unset=False),
            agency_id=self._agency_id,
        )
        self._repo.create(customer)
        self._db.commit()
        self._db.refresh(customer)

        log_action(
            self._db,
            actor,
            "create_customer",
            "customer",
            customer.id,
            f"Created customer: {customer.name}",
        )
        return customer

    def update(self, customer_id: int, payload: CustomerUpdate, actor: User) -> Customer:
        """Update an existing customer."""
        customer = self.get_or_404(customer_id)

        data = payload.model_dump(exclude_unset=True)
        old_kyc = customer.kyc_verified

        self._repo.update(customer, **data)
        self._db.commit()
        self._db.refresh(customer)

        # Auto-note on KYC verification
        if "kyc_verified" in data and data["kyc_verified"] and not old_kyc:
            note = CustomerNote(
                customer_id=customer.id,
                content="KYC verification completed",
                note_type="kyc",
                extra_data={"verified_by": actor.id},
                created_by_id=actor.id,
                agency_id=self._agency_id,
            )
            self._note_repo.create(note)
            self._db.commit()

        log_action(
            self._db,
            actor,
            "update_customer",
            "customer",
            customer.id,
            f"Updated customer: {customer.name}",
        )
        return customer

    def soft_delete(self, customer_id: int, actor: User) -> None:
        """Soft-delete a customer."""
        customer = self.get_or_404(customer_id)
        self._repo.soft_delete(customer)
        self._db.commit()

        log_action(
            self._db,
            actor,
            "delete_customer",
            "customer",
            customer.id,
            f"Soft-deleted customer: {customer.name}",
        )

    # ------------------------------------------------------------------
    # Lead conversion
    # ------------------------------------------------------------------
    def convert_from_lead(
        self,
        lead: Lead,
        actor: User,
        *,
        extra_data: dict[str, Any] | None = None,
    ) -> Customer:
        """Convert a qualified lead into a customer.

        This is called from the lead conversion endpoint. It preserves the
        lead→customer provenance link and creates an audit trail.
        """
        customer = Customer(
            name=lead.name,
            phone=lead.phone,
            email=lead.email,
            agency_id=self._agency_id,
            lead_id=lead.id,
            preferred_contact="phone",
        )
        if extra_data:
            for field, value in extra_data.items():
                if hasattr(customer, field):
                    setattr(customer, field, value)

        self._repo.create(customer)
        self._db.commit()
        self._db.refresh(customer)

        # Create conversion note
        note = CustomerNote(
            customer_id=customer.id,
            content=f"Converted from lead: {lead.name}",
            note_type="system",
            extra_data={"lead_id": lead.id, "source": lead.source},
            created_by_id=actor.id,
            agency_id=self._agency_id,
        )
        self._note_repo.create(note)
        self._db.commit()

        log_action(
            self._db,
            actor,
            "convert_lead",
            "customer",
            customer.id,
            f"Converted lead {lead.id} to customer {customer.name}",
        )
        return customer

    # ------------------------------------------------------------------
    # Notes (Communication Timeline)
    # ------------------------------------------------------------------
    def add_note(
        self,
        customer_id: int,
        content: str,
        note_type: str,
        extra_data: dict | None,
        actor: User,
    ) -> CustomerNote:
        """Add a timeline note to a customer."""
        customer = self.get_or_404(customer_id)
        note = CustomerNote(
            customer_id=customer.id,
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
            "add_customer_note",
            "customer_note",
            note.id,
            f"Added {note_type} note to customer {customer.name}",
        )
        return note

    def list_notes(self, customer_id: int) -> list[CustomerNote]:
        """List all notes for a customer."""
        self.get_or_404(customer_id)
        return self._note_repo.list_for_customer(customer_id, self._agency_id)

    # ------------------------------------------------------------------
    # Dependents
    # ------------------------------------------------------------------
    def add_dependent(
        self, customer_id: int, payload: DependentCreate, actor: User
    ) -> Dependent:
        """Add a dependent to a customer."""
        customer = self.get_or_404(customer_id)
        dep = Dependent(
            customer_id=customer.id,
            agency_id=self._agency_id,
            **payload.model_dump(),
        )
        self._db.add(dep)
        self._db.commit()
        self._db.refresh(dep)

        log_action(
            self._db,
            actor,
            "add_dependent",
            "dependent",
            dep.id,
            f"Added dependent {dep.name} to customer {customer.name}",
        )
        return dep

    def remove_dependent(self, customer_id: int, dependent_id: int, actor: User) -> None:
        """Remove a dependent from a customer."""
        customer = self.get_or_404(customer_id)
        dep = (
            self._db.query(Dependent)
            .filter(
                Dependent.id == dependent_id,
                Dependent.customer_id == customer.id,
                Dependent.agency_id == self._agency_id,
            )
            .first()
        )
        if dep is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dependent not found",
            )
        self._db.delete(dep)
        self._db.commit()

        log_action(
            self._db,
            actor,
            "remove_dependent",
            "dependent",
            dependent_id,
            f"Removed dependent from customer {customer.name}",
        )
