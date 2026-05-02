"""Policy management + manual renewal trigger + Excel bulk import."""
from __future__ import annotations

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    Request,
    Response,
    UploadFile,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_admin, get_current_user
from app.core.logging import get_logger
from app.models.customer import Customer
from app.models.policy import Policy, PolicyStatus
from app.models.user import User
from app.services.policy_constraints import assert_policy_number_unique
from app.schemas.common import PaginatedResponse
from app.schemas.import_schema import ImportResult
from app.schemas.policy import PolicyCreate, PolicyOut, PolicyUpdate
from app.services.audit_service import log_action
from app.services.plan_service import check_policy_limit
from app.services.import_service import import_policies_from_excel
from app.services.renewal_service import run_renewal_check
from app.utils.excel_parser import ExcelValidationError, validate_file
from app.utils.pagination import (
    PaginationParams,
    build_page,
    paginate,
    pagination_params,
)

logger = get_logger(__name__)

router = APIRouter(prefix="/policies", tags=["policies"])


def _assert_customer_in_agency(db: Session, customer_id: int, agency_id: int) -> None:
    exists = (
        db.query(Customer.id)
        .filter(Customer.id == customer_id, Customer.agency_id == agency_id)
        .first()
    )
    if not exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found in this agency",
        )


@router.get("", response_model=PaginatedResponse[PolicyOut])
def list_policies(
    status_filter: PolicyStatus | None = Query(default=None, alias="status"),
    customer_id: int | None = Query(default=None, gt=0),
    params: PaginationParams = Depends(pagination_params),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaginatedResponse[PolicyOut]:
    stmt = select(Policy).where(Policy.agency_id == current_user.agency_id)
    if status_filter is not None:
        stmt = stmt.where(Policy.status == status_filter)
    if customer_id is not None:
        stmt = stmt.where(Policy.customer_id == customer_id)
    stmt = stmt.order_by(Policy.expiry_date.asc())
    rows, total = paginate(db, stmt, params)
    return build_page([PolicyOut.model_validate(r) for r in rows], total, params)


@router.post("", response_model=PolicyOut, status_code=status.HTTP_201_CREATED)
def create_policy(
    payload: PolicyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PolicyOut:
    check_policy_limit(db, current_user.agency_id)
    _assert_customer_in_agency(db, payload.customer_id, current_user.agency_id)

    assert_policy_number_unique(
        db,
        agency_id=current_user.agency_id,
        policy_number=payload.policy_number,
    )

    policy = Policy(
        **payload.model_dump(),
        agency_id=current_user.agency_id,
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    log_action(
        db,
        current_user,
        "created",
        "policy",
        policy.id,
        f"Created policy: {policy.policy_number}",
    )
    return PolicyOut.model_validate(policy)


@router.get("/{policy_id}", response_model=PolicyOut)
def get_policy(
    policy_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PolicyOut:
    policy = (
        db.query(Policy)
        .filter(Policy.id == policy_id, Policy.agency_id == current_user.agency_id)
        .first()
    )
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return PolicyOut.model_validate(policy)


@router.patch("/{policy_id}", response_model=PolicyOut)
def update_policy(
    policy_id: int,
    payload: PolicyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PolicyOut:
    policy = (
        db.query(Policy)
        .filter(Policy.id == policy_id, Policy.agency_id == current_user.agency_id)
        .first()
    )
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    data = payload.model_dump(exclude_unset=True)
    new_start = data.get("start_date", policy.start_date)
    new_expiry = data.get("expiry_date", policy.expiry_date)
    if new_expiry < new_start:
        raise HTTPException(
            status_code=422, detail="expiry_date must be on or after start_date"
        )

    if "policy_number" in data and data["policy_number"] != policy.policy_number:
        assert_policy_number_unique(
            db,
            agency_id=current_user.agency_id,
            policy_number=data["policy_number"],
            exclude_policy_id=policy.id,
        )

    for field, value in data.items():
        setattr(policy, field, value)
    db.commit()
    db.refresh(policy)
    return PolicyOut.model_validate(policy)


@router.delete(
    "/{policy_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_policy(
    policy_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    policy = (
        db.query(Policy)
        .filter(Policy.id == policy_id, Policy.agency_id == current_user.agency_id)
        .first()
    )
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    summary = f"Deleted policy: {policy.policy_number}"
    pid = policy.id
    db.delete(policy)
    db.commit()
    log_action(
        db,
        current_user,
        "deleted",
        "policy",
        pid,
        summary,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/renewals/run",
    summary="Manually trigger the renewal-check job (admin only)",
)
def trigger_renewal_check(
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> dict:
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
    content = await file.read()

    try:
        validate_file(
            filename=file.filename or "",
            content_type=file.content_type,
            size=len(content),
        )
    except ExcelValidationError as exc:
        raise HTTPException(
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
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        )
    except Exception:
        logger.exception(
            "Excel import failed for agency_id=%s filename=%s",
            current_user.agency_id, file.filename,
        )
        raise HTTPException(
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
