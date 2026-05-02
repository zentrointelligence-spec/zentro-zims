"""Quote lifecycle: resolve party, accept → Policy, reject."""
from __future__ import annotations

import time
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.lead import Lead, LeadStatus
from app.models.policy import Policy, PolicyStatus
from app.models.quote import Quote, QuoteStatus
from app.services.policy_constraints import assert_policy_number_unique


def _get_quote_for_agency(db: Session, quote_id: int, agency_id: int) -> Quote:
    q = (
        db.query(Quote)
        .filter(Quote.id == quote_id, Quote.agency_id == agency_id)
        .first()
    )
    if not q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quote not found")
    return q


def resolve_customer_for_quote(db: Session, quote: Quote) -> Customer:
    """Return the Customer backing this quote, creating one from Lead if needed."""
    if quote.customer_id:
        c = (
            db.query(Customer)
            .filter(
                Customer.id == quote.customer_id,
                Customer.agency_id == quote.agency_id,
            )
            .first()
        )
        if not c:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found for this quote",
            )
        return c

    if quote.lead_id:
        lead = (
            db.query(Lead)
            .filter(Lead.id == quote.lead_id, Lead.agency_id == quote.agency_id)
            .first()
        )
        if not lead:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lead not found for this quote",
            )
        existing = (
            db.query(Customer)
            .filter(
                Customer.lead_id == lead.id,
                Customer.agency_id == quote.agency_id,
            )
            .first()
        )
        if existing:
            quote.customer_id = existing.id
            return existing

        c = Customer(
            name=lead.name,
            phone=lead.phone,
            email=lead.email,
            agency_id=quote.agency_id,
            lead_id=lead.id,
        )
        db.add(c)
        db.flush()
        quote.customer_id = c.id
        lead.status = LeadStatus.CONVERTED
        return c

    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="Quote must have lead_id or customer_id",
    )


def accept_quote(
    db: Session,
    *,
    quote_id: int,
    agency_id: int,
    policy_number: str | None,
    start_date: date | None,
    expiry_date: date | None,
) -> tuple[Quote, Policy]:
    quote = _get_quote_for_agency(db, quote_id, agency_id)
    if quote.status in (QuoteStatus.ACCEPTED, QuoteStatus.REJECTED):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Quote is already in a terminal state",
        )

    customer = resolve_customer_for_quote(db, quote)
    today = datetime.now(tz=timezone.utc).date()

    start = start_date or today
    expiry = expiry_date or (today + timedelta(days=365))
    if expiry < start:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="expiry_date must be on or after start_date",
        )

    if policy_number and policy_number.strip():
        pnum = policy_number.strip()
    else:
        pnum = f"POL-{agency_id}-{int(time.time() * 1000)}"
    assert_policy_number_unique(db, agency_id=agency_id, policy_number=pnum)

    policy = Policy(
        customer_id=customer.id,
        policy_type=quote.policy_type,
        policy_number=pnum,
        start_date=start,
        expiry_date=expiry,
        premium=float(Decimal(quote.premium_quoted)),
        status=PolicyStatus.ACTIVE,
        agency_id=agency_id,
    )
    db.add(policy)
    quote.status = QuoteStatus.ACCEPTED
    db.flush()
    db.refresh(policy)
    db.refresh(quote)
    return quote, policy


def reject_quote(db: Session, *, quote_id: int, agency_id: int) -> Quote:
    quote = _get_quote_for_agency(db, quote_id, agency_id)
    if quote.status == QuoteStatus.ACCEPTED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot reject an accepted quote",
        )
    if quote.status == QuoteStatus.REJECTED:
        return quote
    quote.status = QuoteStatus.REJECTED
    db.flush()
    db.refresh(quote)
    return quote
