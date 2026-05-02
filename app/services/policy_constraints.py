"""Cross-module policy invariants (multi-tenant uniqueness)."""
from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.policy import Policy


def assert_policy_number_unique(
    db: Session,
    *,
    agency_id: int,
    policy_number: str,
    exclude_policy_id: int | None = None,
) -> None:
    q = db.query(Policy.id).filter(
        Policy.agency_id == agency_id,
        Policy.policy_number == policy_number,
    )
    if exclude_policy_id is not None:
        q = q.filter(Policy.id != exclude_policy_id)
    if q.first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Policy number already exists for this agency",
        )
