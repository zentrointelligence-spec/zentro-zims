"""Bulk-import pipeline for customers + policies from an Excel file.

Contract
--------
Runs inside a single SQLAlchemy session. On dry-run, everything is rolled
back so no rows hit the DB. On real runs, the full batch is committed once
at the end — a single row's failure never aborts the whole upload, because
each row is wrapped in its own SAVEPOINT.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Any

from sqlalchemy import and_, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import get_logger
from app.models.customer import Customer
from app.models.policy import Policy, PolicyStatus
from app.models.task import Task, TaskStatus, TaskType
from app.schemas.import_schema import ImportResult, RowError
from app.utils.excel_parser import (
    ExcelValidationError,
    _build_header_map,
    normalise_row,
    read_xlsx,
)

logger = get_logger(__name__)


@dataclass
class _Counters:
    total_rows: int = 0
    imported: int = 0
    skipped: int = 0
    customers_created: int = 0
    renewals_flagged: int = 0
    tasks_created: int = 0
    errors: list[RowError] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Per-row helpers (all assume a live session with a running transaction)
# ---------------------------------------------------------------------------


def _find_or_create_customer(
    db: Session,
    *,
    name: str,
    agency_id: int,
    phone: str | None,
    email: str | None,
    created_ctr: _Counters,
) -> Customer:
    existing = db.execute(
        select(Customer).where(
            and_(Customer.name == name, Customer.agency_id == agency_id)
        ).limit(1)
    ).scalar_one_or_none()
    if existing:
        changed = False
        if phone and not existing.phone:
            existing.phone = phone
            changed = True
        if email and not existing.email:
            existing.email = email
            changed = True
        if changed:
            db.flush()
        return existing

    customer = Customer(
        name=name,
        phone=phone or "",
        email=email,
        agency_id=agency_id,
    )
    db.add(customer)
    db.flush()
    created_ctr.customers_created += 1
    return customer


def _determine_status(expiry: date, today: date) -> PolicyStatus:
    if expiry < today:
        return PolicyStatus.EXPIRED
    if expiry <= today + timedelta(days=settings.renewal_window_days):
        return PolicyStatus.RENEWAL_DUE
    return PolicyStatus.ACTIVE


def _ensure_renewal_task(db: Session, policy: Policy) -> bool:
    """Create a renewal task for the policy if no open one exists.
    Returns True when a task is actually created."""
    existing = db.execute(
        select(Task).where(
            and_(
                Task.type == TaskType.RENEWAL,
                Task.related_id == policy.id,
                Task.agency_id == policy.agency_id,
                Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]),
            )
        ).limit(1)
    ).scalar_one_or_none()
    if existing is not None:
        return False

    now_utc = datetime.now(tz=timezone.utc)
    due = datetime.combine(policy.expiry_date, datetime.min.time()).replace(
        tzinfo=timezone.utc
    ) - timedelta(days=7)
    if due < now_utc:
        due = now_utc

    db.add(
        Task(
            related_id=policy.id,
            type=TaskType.RENEWAL,
            title=f"Renewal due: {policy.policy_number}",
            description=(
                f"Imported policy {policy.policy_number} ({policy.policy_type}) "
                f"expires on {policy.expiry_date.isoformat()}."
            ),
            due_date=due,
            status=TaskStatus.PENDING,
            agency_id=policy.agency_id,
        )
    )
    return True


def _process_row(
    db: Session,
    *,
    raw_row: dict[str, Any],
    header_map: dict[str, str],
    agency_id: int,
    today: date,
    ctr: _Counters,
    excel_row: int,
) -> None:
    """Handle one parsed row. Caller wraps this in a SAVEPOINT so any DB
    error rolls back just this row's writes."""
    row = normalise_row(raw_row, header_map)

    # ---- Step 4 — skip duplicate policy_number in this agency ----
    existing = db.execute(
        select(Policy.id).where(
            and_(
                Policy.policy_number == row["policy_number"],
                Policy.agency_id == agency_id,
            )
        ).limit(1)
    ).scalar_one_or_none()
    if existing is not None:
        ctr.skipped += 1
        ctr.errors.append(
            RowError(
                row=excel_row,
                error="Policy number already exists in this agency",
                code="duplicate_policy",
                policy_number=row["policy_number"],
            )
        )
        return

    # ---- Step 3 — find or create customer ----
    customer = _find_or_create_customer(
        db,
        name=row["customer_name"],
        agency_id=agency_id,
        phone=row["phone"],
        email=row["email"],
        created_ctr=ctr,
    )

    # ---- Step 5 — status based on expiry ----
    status = _determine_status(row["expiry_date"], today)

    policy = Policy(
        customer_id=customer.id,
        policy_type=row["policy_type"],
        policy_number=row["policy_number"],
        start_date=row["start_date"],
        expiry_date=row["expiry_date"],
        premium=Decimal(str(row["premium"])),
        status=status,
        agency_id=agency_id,
    )
    db.add(policy)
    db.flush()

    if status == PolicyStatus.RENEWAL_DUE:
        ctr.renewals_flagged += 1
        if _ensure_renewal_task(db, policy):
            ctr.tasks_created += 1

    ctr.imported += 1


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------


def import_policies_from_excel(
    *,
    db: Session,
    content: bytes,
    agency_id: int,
    dry_run: bool = False,
) -> ImportResult:
    """Parse + import an xlsx blob for the given tenant.

    - Row-level failures are collected in `errors`; the pipeline continues.
    - Duplicate policy_numbers (per agency) are counted as `skipped`.
    - When `dry_run=True`, every DB change is rolled back before returning.
    """
    df = read_xlsx(content)  # raises ExcelValidationError if unreadable
    header_map = _build_header_map(list(df.columns))

    missing_cols = [
        c for c in ("customer_name", "policy_number", "expiry_date")
        if c not in header_map
    ]
    if missing_cols:
        raise ExcelValidationError(
            "Missing required column(s): " + ", ".join(missing_cols)
            + ". Expected headers include: customer_name, policy_number, "
            "expiry_date (case-insensitive; aliases are accepted)."
        )

    ctr = _Counters(total_rows=len(df))
    today = date.today()

    # One outer savepoint spans the entire batch so we can cleanly roll back
    # on dry-run without touching the session's top-level transaction state.
    outer = db.begin_nested()

    try:
        for idx, raw_row in enumerate(df.to_dict(orient="records")):
            excel_row = idx + 2  # 1-indexed + header

            # Each row runs inside its own SAVEPOINT. A DB error (integrity,
            # constraint, etc.) only rolls back that row's writes; the outer
            # batch keeps going.
            row_sp = db.begin_nested()
            try:
                _process_row(
                    db,
                    raw_row=raw_row,
                    header_map=header_map,
                    agency_id=agency_id,
                    today=today,
                    ctr=ctr,
                    excel_row=excel_row,
                )
                row_sp.commit()
            except ValueError as exc:
                row_sp.rollback()
                ctr.errors.append(
                    RowError(row=excel_row, error=str(exc), code="validation")
                )
            except SQLAlchemyError as exc:
                row_sp.rollback()
                ctr.errors.append(
                    RowError(
                        row=excel_row,
                        error=f"DB error: {exc.__class__.__name__}",
                        code="database",
                    )
                )
            except Exception as exc:  # noqa: BLE001
                row_sp.rollback()
                ctr.errors.append(
                    RowError(
                        row=excel_row,
                        error=f"Unexpected error: {exc}",
                        code="unexpected",
                    )
                )

        if dry_run:
            outer.rollback()
            logger.info(
                "Dry-run import: would create %s policies (%s skipped, %s errors)",
                ctr.imported, ctr.skipped, len(ctr.errors),
            )
        else:
            outer.commit()
            db.commit()
            logger.info(
                "Import: created %s policies (%s skipped, %s errors)",
                ctr.imported, ctr.skipped, len(ctr.errors),
            )

    except ExcelValidationError:
        if outer.is_active:
            outer.rollback()
        raise
    except Exception:
        if outer.is_active:
            outer.rollback()
        db.rollback()
        logger.exception("Import pipeline crashed")
        raise

    return ImportResult(
        total_rows=ctr.total_rows,
        imported=ctr.imported,
        skipped=ctr.skipped,
        customers_created=ctr.customers_created,
        renewals_flagged=ctr.renewals_flagged,
        tasks_created=ctr.tasks_created,
        dry_run=dry_run,
        errors=ctr.errors,
    )
