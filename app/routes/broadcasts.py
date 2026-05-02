"""WhatsApp broadcast campaigns (agency-scoped)."""
from __future__ import annotations

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Query,
    Response,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, get_db
from app.core.dependencies import get_current_user
from app.core.logging import get_logger
from app.models.broadcast import Broadcast
from app.models.user import User
from app.schemas.broadcast import (
    BroadcastCreate,
    BroadcastDetailResponse,
    BroadcastListResponse,
    BroadcastPreviewBody,
    BroadcastPreviewCustomer,
    BroadcastPreviewResponse,
    BroadcastRecipientResponse,
    BroadcastResponse,
)
from app.services.broadcast_service import (
    execute_broadcast,
    get_broadcast_recipients,
)
from app.utils.pagination import (
    PaginationParams,
    build_page,
    paginate,
    pagination_params,
)

logger = get_logger(__name__)

router = APIRouter(prefix="/broadcasts", tags=["broadcasts"])


def _run_broadcast_job(broadcast_id: int) -> None:
    db = SessionLocal()
    try:
        execute_broadcast(db, broadcast_id)
    except Exception:
        logger.exception("execute_broadcast failed broadcast_id=%s", broadcast_id)
        try:
            b = db.get(Broadcast, broadcast_id)
            if b is not None:
                b.status = "failed"
                db.commit()
        except Exception:
            db.rollback()
    finally:
        db.close()


@router.get("", response_model=BroadcastListResponse)
def list_broadcasts(
    status_filter: str | None = Query(default=None, alias="status"),
    params: PaginationParams = Depends(pagination_params),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BroadcastListResponse:
    stmt = select(Broadcast).where(Broadcast.agency_id == current_user.agency_id)
    if status_filter:
        stmt = stmt.where(Broadcast.status == status_filter)
    stmt = stmt.order_by(Broadcast.created_at.desc())
    rows, total = paginate(db, stmt, params)
    return build_page(
        [BroadcastResponse.model_validate(r) for r in rows], total, params
    )


@router.post("", response_model=BroadcastResponse, status_code=status.HTTP_201_CREATED)
def create_broadcast(
    payload: BroadcastCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BroadcastResponse:
    b = Broadcast(
        name=payload.name,
        target_segment=payload.target_segment,
        policy_type_filter=payload.policy_type_filter,
        message_template=payload.message_template,
        scheduled_at=payload.scheduled_at,
        status="draft",
        agency_id=current_user.agency_id,
    )
    db.add(b)
    db.commit()
    db.refresh(b)
    return BroadcastResponse.model_validate(b)


@router.get("/{broadcast_id}", response_model=BroadcastDetailResponse)
def get_broadcast(
    broadcast_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BroadcastDetailResponse:
    b = db.get(Broadcast, broadcast_id)
    if b is None or b.agency_id != current_user.agency_id:
        raise HTTPException(status_code=404, detail="Broadcast not found")
    base = BroadcastResponse.model_validate(b)
    recs = [BroadcastRecipientResponse.model_validate(r) for r in (b.recipients or [])]
    return BroadcastDetailResponse(**base.model_dump(), recipients=recs)


@router.post("/{broadcast_id}/send")
def send_broadcast(
    broadcast_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    b = db.get(Broadcast, broadcast_id)
    if b is None or b.agency_id != current_user.agency_id:
        raise HTTPException(status_code=404, detail="Broadcast not found")
    if b.status != "draft":
        raise HTTPException(
            status_code=400, detail="Already sent or sending"
        )
    b.status = "sending"
    db.commit()
    background_tasks.add_task(_run_broadcast_job, broadcast_id)
    return {"status": "sending", "broadcast_id": broadcast_id}


@router.post("/{broadcast_id}/preview", response_model=BroadcastPreviewResponse)
def preview_broadcast(
    broadcast_id: int,
    body: BroadcastPreviewBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BroadcastPreviewResponse:
    b = db.get(Broadcast, broadcast_id)
    if b is None or b.agency_id != current_user.agency_id:
        raise HTTPException(status_code=404, detail="Broadcast not found")
    customers = get_broadcast_recipients(
        db,
        agency_id=current_user.agency_id,
        target_segment=body.target_segment,
        policy_type_filter=body.policy_type_filter,
    )
    items = [BroadcastPreviewCustomer(name=c.name, phone=c.phone) for c in customers]
    return BroadcastPreviewResponse(count=len(items), customers=items)


@router.delete(
    "/{broadcast_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_broadcast(
    broadcast_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    b = db.get(Broadcast, broadcast_id)
    if b is None or b.agency_id != current_user.agency_id:
        raise HTTPException(status_code=404, detail="Broadcast not found")
    if b.status != "draft":
        raise HTTPException(
            status_code=400, detail="Only draft broadcasts can be deleted"
        )
    db.delete(b)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
