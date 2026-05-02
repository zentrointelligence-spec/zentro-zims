"""Audit logging — failures must never break primary requests."""
from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.models.audit_log import AuditLog
from app.models.user import User

logger = get_logger(__name__)


def log_action(
    db: Session,
    user: User | None,
    action: str,
    entity_type: str,
    entity_id: int | None,
    summary: str,
    *,
    old_value: dict[str, Any] | list[Any] | None = None,
    new_value: dict[str, Any] | list[Any] | None = None,
    ip_address: str | None = None,
) -> None:
    """Persist an audit row. Swallows all errors."""
    try:
        if user is None:
            user_name = "System"
            user_id = None
            agency_id: int | None = None
        else:
            user_name = user.name
            user_id = user.id
            agency_id = user.agency_id

        if agency_id is None:
            logger.warning("audit skipped: no agency_id for action=%s", action)
            return

        row = AuditLog(
            user_id=user_id,
            user_name=user_name,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            summary=summary,
            old_value=old_value,
            new_value=new_value,
            ip_address=ip_address,
            agency_id=agency_id,
        )
        db.add(row)
        db.commit()
    except Exception:  # pragma: no cover - defensive
        logger.exception("audit log failed action=%s entity=%s", action, entity_type)
        try:
            db.rollback()
        except Exception:
            pass
