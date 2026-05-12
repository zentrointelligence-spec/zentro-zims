"""Lead management — enterprise-grade CRUD with Kanban, bulk ops, AI scoring.

Architecture:
- All business logic lives in ``LeadService``.
- Routes only validate input, call services, and serialize responses.
- Every mutation emits an audit log automatically (service layer).
- Cross-tenant access is impossible: ``LeadService`` is instantiated with
  ``agency_id = current_user.agency_id``.

Route ordering note:
Static paths (``/kanban``, ``/bulk/preview``) MUST be defined BEFORE
parameterized paths (``/{lead_id}``) so FastAPI matches them correctly.
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.lead import LeadStatus
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.customer import CustomerOut
from app.schemas.lead import (
    KanbanBoard,
    KanbanColumn,
    LeadAssignRequest,
    LeadBulkItem,
    LeadBulkPreview,
    LeadCreate,
    LeadDetailOut,
    LeadNoteCreate,
    LeadNoteOut,
    LeadOut,
    LeadStatusUpdateRequest,
    LeadUpdate,
)
from app.services.customer_service import CustomerService
from app.services.lead_service import LeadService
from app.utils.pagination import (
    PaginationParams,
    build_page,
    pagination_params,
)

router = APIRouter(prefix="/leads", tags=["leads"])


def _lead_svc(db: Session, current_user: User) -> LeadService:
    """Factory: scoped LeadService for the current tenant."""
    return LeadService(db, agency_id=current_user.agency_id)


# =============================================================================
# List (must be before /{lead_id})
# =============================================================================
@router.get(
    "",
    response_model=PaginatedResponse[LeadOut],
    summary="List leads with filters, search, and pagination",
)
def list_leads(
    status: LeadStatus | None = Query(default=None),
    search: str | None = Query(default=None, max_length=100),
    tags: list[str] | None = Query(default=None),
    assigned_user_id: int | None = Query(default=None),
    source: str | None = Query(default=None),
    min_score: float | None = Query(default=None, ge=0, le=100),
    max_score: float | None = Query(default=None, ge=0, le=100),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    sort_by: str = Query(default="created_at", pattern="^(created_at|updated_at|last_contact_at|name|lead_score)$"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    params: PaginationParams = Depends(pagination_params),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaginatedResponse[LeadOut]:
    """List leads with full filter support.

    Supports:
    - Status filtering (kanban column view)
    - Full-text search on name, phone, email
    - Tag filtering (OR logic)
    - Assigned agent filtering
    - Date range filtering
    - Score range filtering
    - Multi-column sorting
    """
    svc = _lead_svc(db, current_user)
    rows, total = svc.list(
        status=status,
        search=search,
        tags=tags,
        assigned_user_id=assigned_user_id,
        source=source,
        min_score=min_score,
        max_score=max_score,
        date_from=date_from,
        date_to=date_to,
        sort_by=sort_by,
        sort_order=sort_order,
        page=params.page,
        page_size=params.page_size,
    )
    return build_page([LeadOut.model_validate(r) for r in rows], total, params)


@router.post(
    "",
    response_model=LeadOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new lead",
)
def create_lead(
    payload: LeadCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LeadOut:
    """Create a new lead in the current agency."""
    svc = _lead_svc(db, current_user)
    lead = svc.create(payload, actor=current_user)
    return LeadOut.model_validate(lead)


# =============================================================================
# Static sub-routes (MUST be before /{lead_id})
# =============================================================================
@router.get(
    "/kanban",
    response_model=KanbanBoard,
    summary="Kanban board summary",
)
def get_kanban(
    limit_per_column: int = Query(default=10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> KanbanBoard:
    """Return leads grouped by status for Kanban boards.

    Each column contains a count and a preview of the most recent leads.
    The frontend should call ``GET /leads?status=X`` to load full columns
    on demand.
    """
    svc = _lead_svc(db, current_user)
    summary = svc.kanban_summary(limit_per_column=limit_per_column)

    columns = []
    for status in LeadStatus:
        col = summary.get(status.value, {"count": 0, "leads": []})
        columns.append(
            KanbanColumn(
                status=status.value,
                label=status.value.replace("_", " ").title(),
                count=col["count"],
                leads=[LeadOut.model_validate(l) for l in col["leads"]],
            )
        )
    return KanbanBoard(columns=columns)


@router.post(
    "/bulk/preview",
    response_model=LeadBulkPreview,
    summary="Validate bulk import without persisting",
)
def bulk_preview(
    items: list[LeadBulkItem],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LeadBulkPreview:
    """Dry-run a bulk import. Returns validation errors + preview.

    Use this endpoint to show users a preview before committing the import.
    """
    svc = _lead_svc(db, current_user)
    return svc.bulk_preview(items)


# =============================================================================
# Lead detail + mutations
# =============================================================================
@router.get(
    "/{lead_id}",
    response_model=LeadDetailOut,
    summary="Get lead detail with notes",
)
def get_lead(
    lead_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LeadDetailOut:
    """Fetch a single lead with its full note timeline."""
    svc = _lead_svc(db, current_user)
    lead = svc.get_or_404(lead_id)
    return LeadDetailOut.model_validate(lead)


@router.patch(
    "/{lead_id}",
    response_model=LeadOut,
    summary="Update lead fields",
)
def update_lead(
    lead_id: int,
    payload: LeadUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LeadOut:
    """Update lead fields. If status changes, a timeline note is auto-created."""
    svc = _lead_svc(db, current_user)
    lead = svc.update(lead_id, payload, actor=current_user)
    return LeadOut.model_validate(lead)


@router.delete(
    "/{lead_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Soft-delete a lead",
)
def delete_lead(
    lead_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    """Soft-delete a lead. The record remains for audit and analytics."""
    svc = _lead_svc(db, current_user)
    svc.soft_delete(lead_id, actor=current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# =============================================================================
# Status & Assignment
# =============================================================================
@router.post(
    "/{lead_id}/status",
    response_model=LeadOut,
    summary="Update lead status with timeline note",
)
def update_lead_status(
    lead_id: int,
    payload: LeadStatusUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LeadOut:
    """Move a lead through the pipeline with an optional explanation note."""
    svc = _lead_svc(db, current_user)
    lead = svc.update_status(lead_id, payload, actor=current_user)
    return LeadOut.model_validate(lead)


@router.post(
    "/{lead_id}/assign",
    response_model=LeadOut,
    summary="Assign or unassign a lead",
)
def assign_lead(
    lead_id: int,
    payload: LeadAssignRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LeadOut:
    """Assign a lead to an agent, or unassign by setting ``assigned_user_id`` to null."""
    svc = _lead_svc(db, current_user)
    lead = svc.assign(lead_id, payload.assigned_user_id, actor=current_user)
    return LeadOut.model_validate(lead)


# =============================================================================
# Notes (Activity Timeline)
# =============================================================================
@router.get(
    "/{lead_id}/notes",
    response_model=list[LeadNoteOut],
    summary="List lead notes",
)
def list_lead_notes(
    lead_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[LeadNoteOut]:
    """Fetch the chronological activity timeline for a lead."""
    svc = _lead_svc(db, current_user)
    notes = svc.list_notes(lead_id)
    return [LeadNoteOut.model_validate(n) for n in notes]


@router.post(
    "/{lead_id}/notes",
    response_model=LeadNoteOut,
    status_code=status.HTTP_201_CREATED,
    summary="Add a timeline note",
)
def add_lead_note(
    lead_id: int,
    payload: LeadNoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LeadNoteOut:
    """Add a structured note to the lead's activity timeline."""
    svc = _lead_svc(db, current_user)
    note = svc.add_note(
        lead_id=lead_id,
        content=payload.content,
        note_type=payload.note_type,
        extra_data=payload.extra_data,
        actor=current_user,
    )
    return LeadNoteOut.model_validate(note)


# =============================================================================
# AI Lead Scoring (Placeholder)
# =============================================================================
@router.post(
    "/{lead_id}/score",
    response_model=dict,
    summary="Calculate AI lead score",
)
def calculate_lead_score(
    lead_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Run the AI scoring heuristic and persist the result.

    Phase 3 will replace the heuristic with an OpenAI-powered model.
    """
    svc = _lead_svc(db, current_user)
    return svc.calculate_ai_score(lead_id)


# =============================================================================
# WhatsApp Integration (Placeholder)
# =============================================================================
@router.post(
    "/{lead_id}/whatsapp",
    response_model=dict,
    summary="Send WhatsApp message to lead",
)
def send_whatsapp_to_lead(
    lead_id: int,
    message: str = Query(..., min_length=1, max_length=4000),
    template_name: str | None = Query(default=None, max_length=64),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Send a WhatsApp message to a lead (placeholder — Phase 2).

    Requires ``whatsapp_opt_in=True`` on the lead record.
    """
    svc = _lead_svc(db, current_user)
    return svc.send_whatsapp_message(lead_id, message, template_name)


# =============================================================================
# Lead Conversion (creates Customer)
# =============================================================================
@router.post(
    "/{lead_id}/convert",
    response_model=CustomerOut,
    status_code=status.HTTP_201_CREATED,
    summary="Convert a qualified lead into a customer",
)
def convert_lead(
    lead_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CustomerOut:
    """Convert a lead to a customer.

    The lead status is updated to ``converted`` and a customer record is
    created with a back-reference to the original lead.
    """
    from app.models.lead import Lead

    lead = (
        db.query(Lead)
        .filter(Lead.id == lead_id, Lead.agency_id == current_user.agency_id)
        .first()
    )
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    svc = CustomerService(db, agency_id=current_user.agency_id)
    customer = svc.convert_from_lead(lead, actor=current_user)

    lead.status = LeadStatus.CONVERTED
    db.commit()

    return CustomerOut.model_validate(customer)
