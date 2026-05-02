"""Agency-level settings (auto-provisioned, admin can update)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_admin, get_current_user
from app.models.agency_settings import AgencySettings
from app.models.user import User
from app.schemas.agency_settings import AgencySettingsResponse, AgencySettingsUpdate

router = APIRouter(prefix="/agency", tags=["agency"])


def get_or_create_agency_settings(db: Session, agency_id: int) -> AgencySettings:
    row = (
        db.query(AgencySettings)
        .filter(AgencySettings.agency_id == agency_id)
        .first()
    )
    if row:
        return row
    row = AgencySettings(agency_id=agency_id)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/settings", response_model=AgencySettingsResponse)
def get_agency_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AgencySettingsResponse:
    row = get_or_create_agency_settings(db, current_user.agency_id)
    return AgencySettingsResponse.model_validate(row)


@router.patch("/settings", response_model=AgencySettingsResponse)
def patch_agency_settings(
    payload: AgencySettingsUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AgencySettingsResponse:
    row = get_or_create_agency_settings(db, admin.agency_id)
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(row, k, v)
    db.add(row)
    db.commit()
    db.refresh(row)
    return AgencySettingsResponse.model_validate(row)
