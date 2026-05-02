"""Quotes (pre-policy offers)."""
from __future__ import annotations

from fastapi import APIRouter, Body, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.customer import Customer
from app.models.lead import Lead
from app.models.quote import Quote, QuoteStatus
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.policy import PolicyOut
from app.schemas.quote import (
    QuoteAcceptBody,
    QuoteCreate,
    QuoteOut,
    QuoteUpdate,
)
from app.services.quote_service import accept_quote, reject_quote
from app.utils.pagination import (
    PaginationParams,
    build_page,
    paginate,
    pagination_params,
)

router = APIRouter(prefix="/quotes", tags=["quotes"])


def _assert_lead_in_agency(db: Session, lead_id: int, agency_id: int) -> None:
    if not db.query(Lead.id).filter(Lead.id == lead_id, Lead.agency_id == agency_id).first():
        raise HTTPException(status_code=404, detail="Lead not found in this agency")


def _assert_customer_in_agency(db: Session, customer_id: int, agency_id: int) -> None:
    if not db.query(Customer.id).filter(
        Customer.id == customer_id, Customer.agency_id == agency_id
    ).first():
        raise HTTPException(status_code=404, detail="Customer not found in this agency")


@router.get("", response_model=PaginatedResponse[QuoteOut])
def list_quotes(
    status_filter: QuoteStatus | None = Query(default=None, alias="status"),
    lead_id: int | None = Query(default=None, gt=0),
    customer_id: int | None = Query(default=None, gt=0),
    params: PaginationParams = Depends(pagination_params),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaginatedResponse[QuoteOut]:
    stmt = select(Quote).where(Quote.agency_id == current_user.agency_id)
    if status_filter is not None:
        stmt = stmt.where(Quote.status == status_filter)
    if lead_id is not None:
        stmt = stmt.where(Quote.lead_id == lead_id)
    if customer_id is not None:
        stmt = stmt.where(Quote.customer_id == customer_id)
    stmt = stmt.order_by(Quote.created_at.desc())
    rows, total = paginate(db, stmt, params)
    return build_page([QuoteOut.model_validate(r) for r in rows], total, params)


@router.post("", response_model=QuoteOut, status_code=status.HTTP_201_CREATED)
def create_quote(
    payload: QuoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> QuoteOut:
    aid = current_user.agency_id
    if payload.lead_id is not None:
        _assert_lead_in_agency(db, payload.lead_id, aid)
    elif payload.customer_id is not None:
        _assert_customer_in_agency(db, payload.customer_id, aid)

    quote = Quote(
        agency_id=aid,
        lead_id=payload.lead_id,
        customer_id=payload.customer_id,
        policy_type=payload.policy_type,
        insurer=payload.insurer or "",
        premium_quoted=payload.premium_quoted,
        valid_until=payload.valid_until,
        status=payload.status,
        notes=payload.notes,
    )
    db.add(quote)
    db.commit()
    db.refresh(quote)
    return QuoteOut.model_validate(quote)


@router.get("/{quote_id}", response_model=QuoteOut)
def get_quote(
    quote_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> QuoteOut:
    q = (
        db.query(Quote)
        .filter(Quote.id == quote_id, Quote.agency_id == current_user.agency_id)
        .first()
    )
    if not q:
        raise HTTPException(status_code=404, detail="Quote not found")
    return QuoteOut.model_validate(q)


@router.patch("/{quote_id}", response_model=QuoteOut)
def update_quote(
    quote_id: int,
    payload: QuoteUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> QuoteOut:
    q = (
        db.query(Quote)
        .filter(Quote.id == quote_id, Quote.agency_id == current_user.agency_id)
        .first()
    )
    if not q:
        raise HTTPException(status_code=404, detail="Quote not found")
    if q.status in (QuoteStatus.ACCEPTED, QuoteStatus.REJECTED):
        raise HTTPException(
            status_code=409,
            detail="Cannot update a quote in a terminal state",
        )
    data = payload.model_dump(exclude_unset=True)
    if "status" in data and data["status"] in (
        QuoteStatus.ACCEPTED,
        QuoteStatus.REJECTED,
    ):
        raise HTTPException(
            status_code=422,
            detail="Use POST /quotes/{id}/accept or /reject to change terminal status",
        )
    for field, value in data.items():
        setattr(q, field, value)
    db.commit()
    db.refresh(q)
    return QuoteOut.model_validate(q)


@router.post("/{quote_id}/accept", response_model=PolicyOut)
def accept_quote_endpoint(
    quote_id: int,
    body: QuoteAcceptBody | None = Body(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PolicyOut:
    b = body or QuoteAcceptBody()
    _quote, policy = accept_quote(
        db,
        quote_id=quote_id,
        agency_id=current_user.agency_id,
        policy_number=b.policy_number,
        start_date=b.start_date,
        expiry_date=b.expiry_date,
    )
    db.commit()
    db.refresh(policy)
    return PolicyOut.model_validate(policy)


@router.post("/{quote_id}/reject", response_model=QuoteOut)
def reject_quote_endpoint(
    quote_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> QuoteOut:
    quote = reject_quote(db, quote_id=quote_id, agency_id=current_user.agency_id)
    db.commit()
    db.refresh(quote)
    return QuoteOut.model_validate(quote)


@router.delete(
    "/{quote_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_quote(
    quote_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    q = (
        db.query(Quote)
        .filter(Quote.id == quote_id, Quote.agency_id == current_user.agency_id)
        .first()
    )
    if not q:
        raise HTTPException(status_code=404, detail="Quote not found")
    db.delete(q)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
