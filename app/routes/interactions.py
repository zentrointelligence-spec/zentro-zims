"""Interaction CRUD + outbound WhatsApp send helper."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.integrations.whatsapp import send_whatsapp_message
from app.models.interaction import Interaction, InteractionDirection
from app.models.lead import Lead
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.interaction import InteractionCreate, InteractionOut
from app.utils.pagination import (
    PaginationParams,
    build_page,
    paginate,
    pagination_params,
)

router = APIRouter(prefix="/interactions", tags=["interactions"])


def _get_lead_in_agency(db: Session, lead_id: int, agency_id: int) -> Lead:
    lead = (
        db.query(Lead)
        .filter(Lead.id == lead_id, Lead.agency_id == agency_id)
        .first()
    )
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.get("", response_model=PaginatedResponse[InteractionOut])
def list_interactions(
    lead_id: int | None = Query(default=None, gt=0),
    params: PaginationParams = Depends(pagination_params),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaginatedResponse[InteractionOut]:
    stmt = select(Interaction).where(Interaction.agency_id == current_user.agency_id)
    if lead_id is not None:
        stmt = stmt.where(Interaction.lead_id == lead_id)
    stmt = stmt.order_by(Interaction.timestamp.desc())
    rows, total = paginate(db, stmt, params)
    return build_page([InteractionOut.model_validate(r) for r in rows], total, params)


@router.post(
    "",
    response_model=InteractionOut,
    status_code=status.HTTP_201_CREATED,
    summary="Log an interaction (and optionally send it over WhatsApp)",
)
def create_interaction(
    payload: InteractionCreate,
    send: bool = Query(
        default=False,
        description="If true and direction=outgoing, also send via WhatsApp",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> InteractionOut:
    lead = _get_lead_in_agency(db, payload.lead_id, current_user.agency_id)

    if send and payload.direction == InteractionDirection.OUTGOING:
        send_whatsapp_message(to=lead.phone, body=payload.message)

    interaction = Interaction(
        **payload.model_dump(),
        agency_id=current_user.agency_id,
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return InteractionOut.model_validate(interaction)
