"""Audit log read API (admin only, agency-scoped)."""
from __future__ import annotations

from datetime import date, datetime, time, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit_log import AuditLogListResponse, AuditLogResponse
from app.utils.pagination import PaginationParams, build_page, paginate

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])


def _audit_pagination(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
) -> PaginationParams:
    return PaginationParams(page=page, page_size=page_size)


@router.get("", response_model=AuditLogListResponse)
def list_audit_logs(
    params: PaginationParams = Depends(_audit_pagination),
    action: str | None = Query(default=None),
    entity_type: str | None = Query(default=None),
    user_id: int | None = Query(default=None, gt=0),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AuditLogListResponse:
    aid = admin.agency_id
    stmt = select(AuditLog).where(AuditLog.agency_id == aid)
    if action:
        stmt = stmt.where(AuditLog.action == action)
    if entity_type:
        stmt = stmt.where(AuditLog.entity_type == entity_type)
    if user_id is not None:
        stmt = stmt.where(AuditLog.user_id == user_id)
    if date_from is not None:
        start = datetime.combine(date_from, time.min, tzinfo=timezone.utc)
        stmt = stmt.where(AuditLog.created_at >= start)
    if date_to is not None:
        end = datetime.combine(date_to, time.max, tzinfo=timezone.utc)
        stmt = stmt.where(AuditLog.created_at <= end)
    stmt = stmt.order_by(AuditLog.created_at.desc())
    rows, total = paginate(db, stmt, params)
    return build_page(
        [AuditLogResponse.model_validate(r) for r in rows], total, params
    )
