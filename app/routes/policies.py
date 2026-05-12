"""Policy management — enterprise-grade CRUD with lifecycle, renewal, and timeline.

Architecture:
- All business logic lives in ``PolicyService``.
- Routes only validate input, call services, and serialize responses.
- Static paths (``/search``, ``/renewals/upcoming``) are defined BEFORE
  parameterized paths.
"""
from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_admin, get_current_user
from app.core.logging import get_logger
from app.models.policy import PolicyStatus
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.import_schema import ImportResult
from app.schemas.policy import (
    PolicyCreate,
    PolicyDetailOut,
    PolicyFilterParams,
    PolicyNoteCreate,
    PolicyNoteOut,
    PolicyOut,
    PolicyUpdate,
)
from app.services.audit_service import log_action
from app.services.import_service import import_policies_from_excel
from app.services.policy_service import PolicyService
from app.services.renewal_service import run_renewal_check
from app.utils.excel_parser import ExcelValidationError, validate_file
from app.utils.pagination import (
    PaginationParams,
    build_page,
    pagination_params,
)

logger = get_logger(__name__)

router = APIRouter(prefix="/policies", tags=["policies"])


def _policy_svc(db: Session, current_user: User) -> PolicyService:
    """Factory: scoped PolicyService for the current tenant."""
    return PolicyService(db, agency_id=current_user.agency_id)


# =============================================================================
# Static routes (must come before /{policy_id})
# =============================================================================
@router.get(
    "",
    response_model=PaginatedResponse[PolicyOut],
    summary="List policies with filters and search",
)
def list_policies(
    search: str | None = Query(default=None, max_length=100),
    status: PolicyStatus | None = Query(default=None),
    payment_status: str | None = Query(default=None),
    customer_id: int | None = Query(default=None, gt=0),
    policy_type: str | None = Query(default=None, max_length=64),
    expiry_from: date | None = Query(default=None),
    expiry_to: date | None = Query(default=None),
    sort_by: str = Query(
        default="created_at",
        pattern="^(created_at|updated_at|expiry_date|start_date|premium|policy_number)$",
    ),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    params: PaginationParams = Depends(pagination_params),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaginatedResponse[PolicyOut]:
    """List policies with full filter support.

    Supports:
    - Full-text search on policy_number, policy_type, insurer_name
    - Status and payment_status filtering
    - Customer-scoped filtering
    - Expiry date range filtering
    - Multi-column sorting
    """
    svc = _policy_svc(db, current_user)
    rows, total = svc.list(
        search=search,
        status=status.value if status else None,
        payment_status=payment_status,
        customer_id=customer_id,
        policy_type=policy_type,
        expiry_from=expiry_from,
        expiry_to=expiry_to,
        sort_by=sort_by,
        sort_order=sort_order,
        page=params.page,
        page_size=params.page_size,
    )
    return build_page([PolicyOut.model_validate(r) for r in rows], total, params)


@router.post(
    "",
    response_model=PolicyOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new policy",
)
def create_policy(
    payload: PolicyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PolicyOut:
    """Create a new policy in the current agency."""
    svc = _policy_svc(db, current_user)
    policy = svc.create(payload, actor=current_user)
    return PolicyOut.model_validate(policy)


@router.get(
    "/renewals/upcoming",
    response_model=PaginatedResponse[PolicyOut],
    summary="List upcoming renewals",
)
def list_upcoming_renewals(
    days: int = Query(default=30, ge=1, le=365, description="Look-ahead window in days"),
    params: PaginationParams = Depends(pagination_params),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaginatedResponse[PolicyOut]:
    """Policies expiring within the next N days.

    Used by the dashboard renewal widget and APScheduler hooks.
    """
    svc = _policy_svc(db, current_user)
    rows, total = svc.list_upcoming_renewals(
        days=days, page=params.page, page_size=params.page_size
    )
    return build_page([PolicyOut.model_validate(r) for r in rows], total, params)


@router.post(
    "/renewals/run",
    summary="Manually trigger the renewal-check job (admin only)",
)
def trigger_renewal_check(
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> dict:
    """Execute the daily renewal scan manually."""
    summary = run_renewal_check(db=db)
    return {"status": "ok", **summary.as_dict()}


@router.post(
    "/import",
    response_model=ImportResult,
    status_code=status.HTTP_200_OK,
    summary="Bulk-import customers + policies from an .xlsx file",
)
async def import_policies(
    request: Request,
    file: UploadFile = File(..., description="Excel file (.xlsx)"),
    dry_run: bool = Query(
        default=False,
        description="When true, simulate the import without writing to the DB",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ImportResult:
    """Bulk-import policies from Excel.

    See ``ImportResult`` schema for the response shape.
    """
    content = await file.read()

    try:
        validate_file(
            filename=file.filename or "",
            content_type=file.content_type,
            size=len(content),
        )
    except ExcelValidationError as exc:
        raise HTTPException(  # noqa: F821
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        )

    try:
        result = import_policies_from_excel(
            db=db,
            content=content,
            agency_id=current_user.agency_id,
            dry_run=dry_run,
        )
    except ExcelValidationError as exc:
        raise HTTPException(  # noqa: F821
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        )
    except Exception:
        logger.exception(
            "Excel import failed for agency_id=%s filename=%s",
            current_user.agency_id,
            file.filename,
        )
        raise HTTPException(  # noqa: F821
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process Excel file. Please try again.",
        )

    if not dry_run:
        client = request.client
        log_action(
            db,
            current_user,
            "imported",
            "policy",
            None,
            (
                f"Imported {result.imported} policies from Excel "
                f"(rows {result.total_rows}, skipped {result.skipped})"
            ),
            ip_address=client.host if client else None,
        )

    return result


# =============================================================================
# Detail & Mutations
# =============================================================================
@router.get(
    "/{policy_id}",
    response_model=PolicyDetailOut,
    summary="Get policy detail with notes",
)
def get_policy(
    policy_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PolicyDetailOut:
    """Fetch a single policy with notes and customer."""
    svc = _policy_svc(db, current_user)
    policy = svc.get_or_404(policy_id)
    return PolicyDetailOut.model_validate(policy)


@router.patch(
    "/{policy_id}",
    response_model=PolicyOut,
    summary="Update policy fields",
)
def update_policy(
    policy_id: int,
    payload: PolicyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PolicyOut:
    """Update policy fields. Auto-creates system note on status change."""
    svc = _policy_svc(db, current_user)
    policy = svc.update(policy_id, payload, actor=current_user)
    return PolicyOut.model_validate(policy)


@router.delete(
    "/{policy_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Soft-delete a policy",
)
def delete_policy(
    policy_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    """Soft-delete a policy. Preserves audit trails and note history."""
    svc = _policy_svc(db, current_user)
    svc.soft_delete(policy_id, actor=current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# =============================================================================
# Lifecycle actions
# =============================================================================
@router.post(
    "/{policy_id}/renew",
    response_model=PolicyOut,
    summary="Manually renew a policy",
)
def renew_policy(
    policy_id: int,
    new_expiry_date: date | None = Query(default=None),
    new_premium: float | None = Query(default=None, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PolicyOut:
    """Mark a policy as renewed with optional new expiry date and premium.

    Resets status to ACTIVE and creates a renewal note.
    """
    from decimal import Decimal

    svc = _policy_svc(db, current_user)
    premium_decimal = Decimal(str(new_premium)) if new_premium is not None else None
    policy = svc.mark_renewed(
        policy_id,
        actor=current_user,
        new_expiry_date=new_expiry_date,
        new_premium=premium_decimal,
    )
    return PolicyOut.model_validate(policy)


@router.post(
    "/{policy_id}/expire",
    response_model=PolicyOut,
    summary="Manually mark a policy as expired",
)
def expire_policy(
    policy_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PolicyOut:
    """Mark a policy as expired. Creates a system note."""
    svc = _policy_svc(db, current_user)
    policy = svc.mark_expired(policy_id, actor=current_user)
    return PolicyOut.model_validate(policy)


# =============================================================================
# Notes (Lifecycle Timeline)
# =============================================================================
@router.get(
    "/{policy_id}/notes",
    response_model=list[PolicyNoteOut],
    summary="List policy notes",
)
def list_policy_notes(
    policy_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[PolicyNoteOut]:
    """Fetch the chronological activity timeline for a policy."""
    svc = _policy_svc(db, current_user)
    notes = svc.list_notes(policy_id)
    return [PolicyNoteOut.model_validate(n) for n in notes]


@router.post(
    "/{policy_id}/notes",
    response_model=PolicyNoteOut,
    status_code=status.HTTP_201_CREATED,
    summary="Add a lifecycle note",
)
def add_policy_note(
    policy_id: int,
    payload: PolicyNoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PolicyNoteOut:
    """Add a structured note to the policy's lifecycle timeline."""
    svc = _policy_svc(db, current_user)
    note = svc.add_note(
        policy_id=policy_id,
        content=payload.content,
        note_type=payload.note_type,
        extra_data=payload.extra_data,
        actor=current_user,
    )
    return PolicyNoteOut.model_validate(note)


# =============================================================================
# Documents (preparation hook)
# =============================================================================
@router.get(
    "/{policy_id}/documents",
    response_model=list[dict],
    summary="List policy documents",
)
def list_policy_documents(
    policy_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict]:
    """List documents attached to this policy.

    Preparation hook for the Phase 2 Document module. Returns lightweight
    metadata only — actual file serving is handled by the documents API.
    """
    svc = _policy_svc(db, current_user)
    docs = svc.get_documents(policy_id)
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
