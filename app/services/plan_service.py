"""Plan limits and enforcement (per-agency billing tier)."""
from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.agency import Agency
from app.models.lead import Lead
from app.models.policy import Policy
from app.models.user import User

PLAN_LIMITS: dict[str, dict[str, int | None]] = {
    "starter": {
        "max_users": 3,
        "max_leads": 100,
        "max_policies": 50,
    },
    "growth": {
        "max_users": 10,
        "max_leads": None,
        "max_policies": None,
    },
    "pro": {
        "max_users": None,
        "max_leads": None,
        "max_policies": None,
    },
}


def _normalize_plan(plan: str | None) -> str:
    p = (plan or "starter").strip().lower()
    return p if p in PLAN_LIMITS else "starter"


def _agency_plan(db: Session, agency_id: int) -> str:
    agency = db.get(Agency, agency_id)
    if agency is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found",
        )
    return _normalize_plan(getattr(agency, "plan", None))


def check_lead_limit(db: Session, agency_id: int, plan: str | None = None) -> None:
    tier = _normalize_plan(plan) if plan is not None else _agency_plan(db, agency_id)
    limit = PLAN_LIMITS[tier]["max_leads"]
    if limit is None:
        return
    count = db.scalar(
        select(func.count(Lead.id)).where(Lead.agency_id == agency_id)
    )
    current = int(count or 0)
    if current >= limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Lead limit reached for your plan. "
                "Upgrade to Growth for unlimited leads."
            ),
        )


def check_policy_limit(db: Session, agency_id: int, plan: str | None = None) -> None:
    tier = _normalize_plan(plan) if plan is not None else _agency_plan(db, agency_id)
    limit = PLAN_LIMITS[tier]["max_policies"]
    if limit is None:
        return
    count = db.scalar(
        select(func.count(Policy.id)).where(Policy.agency_id == agency_id)
    )
    current = int(count or 0)
    if current >= limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Policy limit reached for your plan. "
                "Upgrade to Growth for unlimited policies."
            ),
        )


def check_user_limit(db: Session, agency_id: int, plan: str | None = None) -> None:
    tier = _normalize_plan(plan) if plan is not None else _agency_plan(db, agency_id)
    limit = PLAN_LIMITS[tier]["max_users"]
    if limit is None:
        return
    count = db.scalar(
        select(func.count(User.id)).where(User.agency_id == agency_id)
    )
    current = int(count or 0)
    if current >= limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "User limit reached for your plan. "
                "Upgrade to Growth for more seats."
            ),
        )


def limits_for_plan(plan: str) -> dict[str, int | None]:
    tier = _normalize_plan(plan)
    return PLAN_LIMITS[tier]
