"""Customer management — enterprise-grade CRUD with KYC, timeline, dependents.

Architecture:
- All business logic lives in ``CustomerService``.
- Routes only validate input, call services, and serialize responses.
- Static paths (``/search``) are defined BEFORE parameterized paths.
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.customer import (
    CustomerCreate,
    CustomerDetailOut,
    CustomerNoteCreate,
    CustomerNoteOut,
    CustomerOut,
    CustomerUpdate,
)
from app.schemas.dependent import DependentCreate, DependentResponse
from app.services.customer_service import CustomerService
from app.utils.pagination import (
    PaginationParams,
    build_page,
    pagination_params,
)

router = APIRouter(prefix="/customers", tags=["customers"])


def _customer_svc(db: Session, current_user: User) -> CustomerService:
    """Factory: scoped CustomerService for the current tenant."""
    return CustomerService(db, agency_id=current_user.agency_id)


# =============================================================================
# List & Create
# =============================================================================
@router.get(
    "",
    response_model=PaginatedResponse[CustomerOut],
    summary="List customers with filters and search",
)
def list_customers(
    search: str | None = Query(default=None, max_length=100),
    kyc_verified: bool | None = Query(default=None),
    risk_profile: str | None = Query(default=None),
    preferred_contact: str | None = Query(default=None),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    sort_by: str = Query(default="created_at", pattern="^(created_at|updated_at|name|date_of_birth)$"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    params: PaginationParams = Depends(pagination_params),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaginatedResponse[CustomerOut]:
    """List customers with full filter support.

    Supports:
    - Full-text search on name, phone, email, id_number
    - KYC status filtering
    - Risk profile filtering
    - Preferred contact filtering
    - Date range filtering
    - Multi-column sorting
    """
    svc = _customer_svc(db, current_user)
    rows, total = svc.list(
        search=search,
        kyc_verified=kyc_verified,
        risk_profile=risk_profile,
        preferred_contact=preferred_contact,
        date_from=date_from,
        date_to=date_to,
        sort_by=sort_by,
        sort_order=sort_order,
        page=params.page,
        page_size=params.page_size,
    )
    return build_page([CustomerOut.model_validate(r) for r in rows], total, params)


@router.post(
    "",
    response_model=CustomerOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new customer",
)
def create_customer(
    payload: CustomerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CustomerOut:
    """Create a new customer in the current agency."""
    svc = _customer_svc(db, current_user)
    customer = svc.create(payload, actor=current_user)
    return CustomerOut.model_validate(customer)


# =============================================================================
# Detail & Mutations
# =============================================================================
@router.get(
    "/{customer_id}",
    response_model=CustomerDetailOut,
    summary="Get customer detail with notes",
)
def get_customer(
    customer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CustomerDetailOut:
    """Fetch a single customer with notes and dependents."""
    svc = _customer_svc(db, current_user)
    customer = svc.get_or_404(customer_id)
    return CustomerDetailOut.model_validate(customer)


@router.patch(
    "/{customer_id}",
    response_model=CustomerOut,
    summary="Update customer fields",
)
def update_customer(
    customer_id: int,
    payload: CustomerUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CustomerOut:
    """Update customer fields. Auto-creates KYC note when verified."""
    svc = _customer_svc(db, current_user)
    customer = svc.update(customer_id, payload, actor=current_user)
    return CustomerOut.model_validate(customer)


@router.delete(
    "/{customer_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Soft-delete a customer",
)
def delete_customer(
    customer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    """Soft-delete a customer. Preserves policy history and audit trails."""
    svc = _customer_svc(db, current_user)
    svc.soft_delete(customer_id, actor=current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# =============================================================================
# Notes (Communication Timeline)
# =============================================================================
@router.get(
    "/{customer_id}/notes",
    response_model=list[CustomerNoteOut],
    summary="List customer notes",
)
def list_customer_notes(
    customer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CustomerNoteOut]:
    """Fetch the chronological activity timeline for a customer."""
    svc = _customer_svc(db, current_user)
    notes = svc.list_notes(customer_id)
    return [CustomerNoteOut.model_validate(n) for n in notes]


@router.post(
    "/{customer_id}/notes",
    response_model=CustomerNoteOut,
    status_code=status.HTTP_201_CREATED,
    summary="Add a timeline note",
)
def add_customer_note(
    customer_id: int,
    payload: CustomerNoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CustomerNoteOut:
    """Add a structured note to the customer's communication timeline."""
    svc = _customer_svc(db, current_user)
    note = svc.add_note(
        customer_id=customer_id,
        content=payload.content,
        note_type=payload.note_type,
        extra_data=payload.extra_data,
        actor=current_user,
    )
    return CustomerNoteOut.model_validate(note)


# =============================================================================
# Dependents
# =============================================================================
@router.get(
    "/{customer_id}/dependents",
    response_model=list[DependentResponse],
    summary="List customer dependents",
)
def list_dependents(
    customer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[DependentResponse]:
    """Fetch all dependents for a customer."""
    svc = _customer_svc(db, current_user)
    customer = svc.get_or_404(customer_id)
    return [DependentResponse.model_validate(d) for d in customer.dependents]


@router.post(
    "/{customer_id}/dependents",
    response_model=DependentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a dependent",
)
def create_dependent(
    customer_id: int,
    payload: DependentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DependentResponse:
    """Add a dependent (spouse, child, parent) to a customer."""
    svc = _customer_svc(db, current_user)
    dep = svc.add_dependent(customer_id, payload, actor=current_user)
    return DependentResponse.model_validate(dep)


@router.delete(
    "/{customer_id}/dependents/{dependent_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Remove a dependent",
)
def delete_dependent(
    customer_id: int,
    dependent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    """Remove a dependent from a customer."""
    svc = _customer_svc(db, current_user)
    svc.remove_dependent(customer_id, dependent_id, actor=current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# =============================================================================
# Documents (preparation hook)
# =============================================================================
@router.get(
    "/{customer_id}/documents",
    response_model=list[dict],
    summary="List customer documents",
)
def list_customer_documents(
    customer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict]:
    """List documents attached to this customer.

    Preparation hook for the Phase 2 Document module. Returns lightweight
    metadata only — actual file serving is handled by the documents API.
    """
    svc = _customer_svc(db, current_user)
    docs = svc.get_documents(customer_id)
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "file_size_kb": d.file_size_kb,
            "content_type": d.content_type,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        }
        for d in docs
    ]
