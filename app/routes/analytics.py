"""Agency-scoped analytics summaries."""
from __future__ import annotations

from calendar import monthrange
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import extract, func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.customer import Customer
from app.models.lead import Lead, LeadStatus
from app.models.policy import Policy, PolicyStatus
from app.models.task import Task, TaskStatus
from app.models.user import User
from app.schemas.analytics import (
    AnalyticsMonthlyRow,
    AnalyticsSummaryResponse,
    CustomersSummary,
    LeadStatusCounts,
    LeadsSummary,
    PoliciesSummary,
    PolicyStatusCounts,
    TasksSummary,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary", response_model=AnalyticsSummaryResponse)
def analytics_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AnalyticsSummaryResponse:
    aid = current_user.agency_id
    now = datetime.now(timezone.utc)
    y = now.year
    m = now.month

    # --- Leads (SQL aggregations) ---
    total_leads = int(
        db.scalar(select(func.count(Lead.id)).where(Lead.agency_id == aid)) or 0
    )
    lead_rows = db.execute(
        select(Lead.status, func.count(Lead.id))
        .where(Lead.agency_id == aid)
        .group_by(Lead.status)
    ).all()
    lead_counts: dict[LeadStatus, int] = {row[0]: int(row[1]) for row in lead_rows}

    def _lc(status: LeadStatus) -> int:
        return int(lead_counts.get(status, 0))

    converted = _lc(LeadStatus.CONVERTED)
    conversion_rate = (
        round(100.0 * converted / total_leads, 2) if total_leads else 0.0
    )

    leads_summary = LeadsSummary(
        total=total_leads,
        by_status=LeadStatusCounts(
            new=_lc(LeadStatus.NEW),
            contacted=_lc(LeadStatus.CONTACTED),
            qualified=_lc(LeadStatus.QUALIFIED),
            converted=converted,
            lost=_lc(LeadStatus.LOST),
        ),
        conversion_rate=conversion_rate,
    )

    # --- Customers ---
    total_customers = int(
        db.scalar(select(func.count(Customer.id)).where(Customer.agency_id == aid)) or 0
    )

    # --- Policies ---
    total_policies = int(
        db.scalar(select(func.count(Policy.id)).where(Policy.agency_id == aid)) or 0
    )
    pol_rows = db.execute(
        select(Policy.status, func.count(Policy.id))
        .where(Policy.agency_id == aid)
        .group_by(Policy.status)
    ).all()
    pol_counts: dict[PolicyStatus, int] = {row[0]: int(row[1]) for row in pol_rows}

    def _pc(st: PolicyStatus) -> int:
        return int(pol_counts.get(st, 0))

    premium_sum = db.scalar(
        select(func.coalesce(func.sum(Policy.premium), 0)).where(
            Policy.agency_id == aid,
            Policy.status == PolicyStatus.ACTIVE,
        )
    )
    total_premium_value = float(premium_sum or 0)

    policies_summary = PoliciesSummary(
        total=total_policies,
        by_status=PolicyStatusCounts(
            active=_pc(PolicyStatus.ACTIVE),
            expired=_pc(PolicyStatus.EXPIRED),
            renewal_due=_pc(PolicyStatus.RENEWAL_DUE),
            cancelled=_pc(PolicyStatus.CANCELLED),
        ),
        total_premium_value=round(total_premium_value, 2),
    )

    # --- Tasks ---
    total_tasks = int(
        db.scalar(select(func.count(Task.id)).where(Task.agency_id == aid)) or 0
    )
    pending_tasks = int(
        db.scalar(
            select(func.count(Task.id)).where(
                Task.agency_id == aid,
                Task.status == TaskStatus.PENDING,
            )
        )
        or 0
    )
    overdue_tasks = int(
        db.scalar(
            select(func.count(Task.id)).where(
                Task.agency_id == aid,
                Task.status == TaskStatus.PENDING,
                Task.due_date < now,
            )
        )
        or 0
    )

    renewals_due_this_month = int(
        db.scalar(
            select(func.count(Policy.id)).where(
                Policy.agency_id == aid,
                Policy.status == PolicyStatus.RENEWAL_DUE,
                extract("month", Policy.expiry_date) == m,
                extract("year", Policy.expiry_date) == y,
            )
        )
        or 0
    )

    expired_this_month = int(
        db.scalar(
            select(func.count(Policy.id)).where(
                Policy.agency_id == aid,
                Policy.status == PolicyStatus.EXPIRED,
                extract("month", Policy.expiry_date) == m,
                extract("year", Policy.expiry_date) == y,
            )
        )
        or 0
    )

    return AnalyticsSummaryResponse(
        leads=leads_summary,
        customers=CustomersSummary(total=total_customers),
        policies=policies_summary,
        tasks=TasksSummary(
            total=total_tasks,
            pending=pending_tasks,
            overdue=overdue_tasks,
        ),
        renewals_due_this_month=renewals_due_this_month,
        expired_this_month=expired_this_month,
        agents=[],
    )


def _month_window_utc(year: int, month: int) -> tuple[datetime, datetime]:
    start = datetime(year, month, 1, 0, 0, 0, tzinfo=timezone.utc)
    last_day = monthrange(year, month)[1]
    end = datetime(year, month, last_day, 23, 59, 59, tzinfo=timezone.utc)
    return start, end


def _last_six_month_keys(now: datetime) -> list[str]:
    y, m = now.year, now.month
    keys: list[str] = []
    for _ in range(6):
        keys.insert(0, f"{y:04d}-{m:02d}")
        m -= 1
        if m == 0:
            m = 12
            y -= 1
    return keys


@router.get("/monthly", response_model=list[AnalyticsMonthlyRow])
def analytics_monthly(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AnalyticsMonthlyRow]:
    """Last six calendar months of leads, policies, and premium booked (created)."""
    aid = current_user.agency_id
    now = datetime.now(timezone.utc)
    out: list[AnalyticsMonthlyRow] = []
    for key in _last_six_month_keys(now):
        y_str, m_str = key.split("-")
        y, m = int(y_str), int(m_str)
        start, end = _month_window_utc(y, m)

        leads_created = int(
            db.scalar(
                select(func.count(Lead.id)).where(
                    Lead.agency_id == aid,
                    Lead.created_at >= start,
                    Lead.created_at <= end,
                )
            )
            or 0
        )
        policies_created = int(
            db.scalar(
                select(func.count(Policy.id)).where(
                    Policy.agency_id == aid,
                    Policy.created_at >= start,
                    Policy.created_at <= end,
                )
            )
            or 0
        )
        prem = db.scalar(
            select(func.coalesce(func.sum(Policy.premium), 0)).where(
                Policy.agency_id == aid,
                Policy.created_at >= start,
                Policy.created_at <= end,
            )
        )
        revenue = float(prem or 0)

        out.append(
            AnalyticsMonthlyRow(
                month=key,
                leads_created=leads_created,
                policies_created=policies_created,
                revenue=round(revenue, 2),
            )
        )
    return out
