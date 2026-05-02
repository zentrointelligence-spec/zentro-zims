"""Customer dependents."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.customer import Customer
from app.models.dependent import Dependent
from app.models.user import User
from app.schemas.dependent import DependentCreate, DependentListResponse, DependentResponse

router = APIRouter(tags=["dependents"])


@router.get(
    "/customers/{customer_id}/dependents",
    response_model=DependentListResponse,
)
def list_dependents(
    customer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DependentListResponse:
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

    stmt = (
        select(Dependent)
        .where(
            Dependent.customer_id == customer_id,
            Dependent.agency_id == current_user.agency_id,
        )
        .order_by(Dependent.created_at.desc())
    )
    rows = list(db.scalars(stmt).all())
    total_stmt = select(func.count(Dependent.id)).where(
        Dependent.customer_id == customer_id,
        Dependent.agency_id == current_user.agency_id,
    )
    total = int(db.scalar(total_stmt) or 0)
    return DependentListResponse(
        items=[DependentResponse.model_validate(r) for r in rows],
        total=total,
    )


@router.post(
    "/customers/{customer_id}/dependents",
    response_model=DependentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_dependent(
    customer_id: int,
    payload: DependentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DependentResponse:
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

    data = payload.model_dump()
    dep = Dependent(
        customer_id=customer_id,
        agency_id=current_user.agency_id,
        name=data["name"],
        date_of_birth=data.get("date_of_birth"),
        relationship=data["relationship"],
        id_number=data.get("id_number"),
    )
    db.add(dep)
    db.commit()
    db.refresh(dep)
    return DependentResponse.model_validate(dep)


@router.delete(
    "/customers/{customer_id}/dependents/{dep_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_dependent(
    customer_id: int,
    dep_id: int,
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

    dep = (
        db.query(Dependent)
        .filter(
            Dependent.id == dep_id,
            Dependent.customer_id == customer_id,
            Dependent.agency_id == current_user.agency_id,
        )
        .first()
    )
    if not dep:
        raise HTTPException(status_code=404, detail="Dependent not found")
    db.delete(dep)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
