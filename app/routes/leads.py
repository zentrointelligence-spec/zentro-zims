"""Lead management."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.customer import Customer
from app.models.lead import Lead, LeadStatus
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.customer import CustomerOut
from app.schemas.lead import LeadCreate, LeadOut, LeadUpdate
from app.services.audit_service import log_action
from app.services.plan_service import check_lead_limit
from app.utils.pagination import (
    PaginationParams,
    build_page,
    paginate,
    pagination_params,
)

router = APIRouter(prefix="/leads", tags=["leads"])


@router.get("", response_model=PaginatedResponse[LeadOut])
def list_leads(
    status_filter: LeadStatus | None = Query(default=None, alias="status"),
    search: str | None = Query(default=None, description="Search name, phone or email"),
    params: PaginationParams = Depends(pagination_params),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaginatedResponse[LeadOut]:
    stmt = select(Lead).where(Lead.agency_id == current_user.agency_id)
    if status_filter is not None:
        stmt = stmt.where(Lead.status == status_filter)
    if search:
        like = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(Lead.name.ilike(like), Lead.phone.ilike(like), Lead.email.ilike(like))
        )
    stmt = stmt.order_by(Lead.created_at.desc())
    rows, total = paginate(db, stmt, params)
    return build_page([LeadOut.model_validate(r) for r in rows], total, params)


@router.post("", response_model=LeadOut, status_code=status.HTTP_201_CREATED)
def create_lead(
    payload: LeadCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LeadOut:
    check_lead_limit(db, current_user.agency_id)
    lead = Lead(
        **payload.model_dump(exclude_none=False),
        agency_id=current_user.agency_id,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    log_action(
        db,
        current_user,
        "created",
        "lead",
        lead.id,
        f"Created lead: {lead.name}",
    )
    return LeadOut.model_validate(lead)


@router.get("/{lead_id}", response_model=LeadOut)
def get_lead(
    lead_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LeadOut:
    lead = (
        db.query(Lead)
        .filter(Lead.id == lead_id, Lead.agency_id == current_user.agency_id)
        .first()
    )
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return LeadOut.model_validate(lead)


@router.patch("/{lead_id}", response_model=LeadOut)
def update_lead(
    lead_id: int,
    payload: LeadUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LeadOut:
    lead = (
        db.query(Lead)
        .filter(Lead.id == lead_id, Lead.agency_id == current_user.agency_id)
        .first()
    )
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(lead, field, value)

    db.commit()
    db.refresh(lead)
    return LeadOut.model_validate(lead)


@router.delete(
    "/{lead_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_lead(
    lead_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    lead = (
        db.query(Lead)
        .filter(Lead.id == lead_id, Lead.agency_id == current_user.agency_id)
        .first()
    )
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    summary = f"Deleted lead: {lead.name}"
    lid = lead.id
    db.delete(lead)
    db.commit()
    log_action(
        db,
        current_user,
        "deleted",
        "lead",
        lid,
        summary,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


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
    lead = (
        db.query(Lead)
        .filter(Lead.id == lead_id, Lead.agency_id == current_user.agency_id)
        .first()
    )
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    if lead.status == LeadStatus.CONVERTED:
        existing = (
            db.query(Customer)
            .filter(
                Customer.lead_id == lead.id,
                Customer.agency_id == current_user.agency_id,
            )
            .first()
        )
        if existing:
            return CustomerOut.model_validate(existing)

    customer = Customer(
        name=lead.name,
        phone=lead.phone,
        email=lead.email,
        agency_id=current_user.agency_id,
        lead_id=lead.id,
    )
    db.add(customer)

    lead.status = LeadStatus.CONVERTED
    db.commit()
    db.refresh(customer)
    log_action(
        db,
        current_user,
        "converted",
        "lead",
        lead.id,
        f"Converted lead: {lead.name} to customer",
    )
    return CustomerOut.model_validate(customer)
