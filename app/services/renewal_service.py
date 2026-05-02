"""Renewal automation engine.

Runs daily via APScheduler:

1. Marks policies expiring in the next N days as RENEWAL_DUE.
2. Marks policies whose expiry has passed as EXPIRED.
3. Creates one `renewal` Task per policy flagged as RENEWAL_DUE (idempotent).
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.logging import get_logger
from app.models.policy import Policy, PolicyStatus
from app.models.task import Task, TaskStatus, TaskType

logger = get_logger(__name__)


@dataclass
class RenewalRunSummary:
    flagged_renewal_due: int
    marked_expired: int
    tasks_created: int

    def as_dict(self) -> dict[str, int]:
        return {
            "flagged_renewal_due": self.flagged_renewal_due,
            "marked_expired": self.marked_expired,
            "tasks_created": self.tasks_created,
        }


def _flag_renewal_due(db: Session, today, window_end) -> list[Policy]:
    stmt = select(Policy).where(
        and_(
            Policy.status == PolicyStatus.ACTIVE,
            Policy.expiry_date >= today,
            Policy.expiry_date <= window_end,
        )
    )
    policies = list(db.execute(stmt).scalars().all())
    for p in policies:
        p.status = PolicyStatus.RENEWAL_DUE
    return policies


def _mark_expired(db: Session, today) -> int:
    stmt = select(Policy).where(
        and_(
            Policy.status.in_([PolicyStatus.ACTIVE, PolicyStatus.RENEWAL_DUE]),
            Policy.expiry_date < today,
        )
    )
    policies = list(db.execute(stmt).scalars().all())
    for p in policies:
        p.status = PolicyStatus.EXPIRED
    return len(policies)


def _ensure_renewal_task(db: Session, policy: Policy) -> bool:
    """Create a renewal task for the policy if no open one exists. Returns True if created."""
    existing = db.execute(
        select(Task).where(
            and_(
                Task.type == TaskType.RENEWAL,
                Task.related_id == policy.id,
                Task.agency_id == policy.agency_id,
                Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]),
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        return False

    # due_date = 7 days before expiry, but never in the past
    due = datetime.combine(policy.expiry_date, datetime.min.time()).replace(
        tzinfo=timezone.utc
    ) - timedelta(days=7)
    now = datetime.now(tz=timezone.utc)
    if due < now:
        due = now

    task = Task(
        related_id=policy.id,
        type=TaskType.RENEWAL,
        title=f"Renewal due: policy {policy.policy_number}",
        description=(
            f"Policy {policy.policy_number} ({policy.policy_type}) expires on "
            f"{policy.expiry_date.isoformat()}."
        ),
        due_date=due,
        status=TaskStatus.PENDING,
        agency_id=policy.agency_id,
    )
    db.add(task)
    return True


def run_renewal_check(db: Session | None = None) -> RenewalRunSummary:
    """Execute a full renewal scan. Safe to run manually or via scheduler."""
    owns_session = db is None
    session: Session = db or SessionLocal()

    try:
        today = datetime.now(tz=timezone.utc).date()
        window_end = today + timedelta(days=settings.renewal_window_days)

        flagged = _flag_renewal_due(session, today, window_end)
        expired_count = _mark_expired(session, today)

        # Flush status changes so tasks reference the updated policies.
        session.flush()

        tasks_created = 0
        # Tasks are created for any policy currently in RENEWAL_DUE status
        # (including ones we just flagged AND any previously flagged without a task).
        pending_renewal = (
            session.execute(
                select(Policy).where(Policy.status == PolicyStatus.RENEWAL_DUE)
            )
            .scalars()
            .all()
        )
        for p in pending_renewal:
            if _ensure_renewal_task(session, p):
                tasks_created += 1

        session.commit()

        summary = RenewalRunSummary(
            flagged_renewal_due=len(flagged),
            marked_expired=expired_count,
            tasks_created=tasks_created,
        )
        logger.info("Renewal check complete: %s", summary.as_dict())
        return summary
    except Exception:
        session.rollback()
        logger.exception("Renewal check failed")
        raise
    finally:
        if owns_session:
            session.close()
