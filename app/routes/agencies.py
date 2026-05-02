"""Tenant (agency) settings for the authenticated user's organization."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_admin, get_current_user
from app.models.agency import Agency
from app.models.user import User
from app.schemas.agency import AgencyMeOut, AgencyMeUpdate

router = APIRouter(prefix="/agencies", tags=["agencies"])


@router.get("/me", response_model=AgencyMeOut)
def get_my_agency(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AgencyMeOut:
    agency = db.query(Agency).filter(Agency.id == current_user.agency_id).first()
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found",
        )
    return AgencyMeOut.model_validate(agency)


@router.patch("/me", response_model=AgencyMeOut)
def patch_my_agency(
    payload: AgencyMeUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AgencyMeOut:
    agency = db.query(Agency).filter(Agency.id == admin.agency_id).first()
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found",
        )
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(agency, field, value)
    db.commit()
    db.refresh(agency)
    return AgencyMeOut.model_validate(agency)
