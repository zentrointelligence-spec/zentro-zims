"""Customer management."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.customer import Customer
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.customer import CustomerCreate, CustomerOut, CustomerUpdate
from app.services.audit_service import log_action
from app.utils.pagination import (
    PaginationParams,
    build_page,
    paginate,
    pagination_params,
)

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("", response_model=PaginatedResponse[CustomerOut])
def list_customers(
    search: str | None = Query(default=None),
    params: PaginationParams = Depends(pagination_params),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaginatedResponse[CustomerOut]:
    stmt = select(Customer).where(Customer.agency_id == current_user.agency_id)
    if search:
        like = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Customer.name.ilike(like),
                Customer.phone.ilike(like),
                Customer.email.ilike(like),
            )
        )
    stmt = stmt.order_by(Customer.created_at.desc())
    rows, total = paginate(db, stmt, params)
    return build_page([CustomerOut.model_validate(r) for r in rows], total, params)


@router.post("", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: CustomerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CustomerOut:
    customer = Customer(
        **payload.model_dump(),
        agency_id=current_user.agency_id,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    log_action(
        db,
        current_user,
        "created",
        "customer",
        customer.id,
        f"Created customer: {customer.name}",
    )
    return CustomerOut.model_validate(customer)


@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(
    customer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CustomerOut:
    customer = (
        db.query(Customer)
        .filter(
            Customer.id == customer_id,
            Customer.agency_id == current_user.agency_id,
        )
        .first()
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return CustomerOut.model_validate(customer)


@router.patch("/{customer_id}", response_model=CustomerOut)
def update_customer(
    customer_id: int,
    payload: CustomerUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CustomerOut:
    customer = (
        db.query(Customer)
        .filter(
            Customer.id == customer_id,
            Customer.agency_id == current_user.agency_id,
        )
        .first()
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(customer, field, value)
    db.commit()
    db.refresh(customer)
    return CustomerOut.model_validate(customer)


@router.delete(
    "/{customer_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_customer(
    customer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    customer = (
        db.query(Customer)
        .filter(
            Customer.id == customer_id,
            Customer.agency_id == current_user.agency_id,
        )
        .first()
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    summary = f"Deleted customer: {customer.name}"
    cid = customer.id
    db.delete(customer)
    db.commit()
    log_action(
        db,
        current_user,
        "deleted",
        "customer",
        cid,
        summary,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
