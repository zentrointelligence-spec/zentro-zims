"""Birthday sweep — WhatsApp greeting (when configured) + follow-up task per customer."""
from __future__ import annotations

from datetime import datetime, time, timedelta, timezone

from sqlalchemy import extract, func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import get_logger
from app.integrations.whatsapp import send_whatsapp_message
from app.models.agency_settings import AgencySettings
from app.models.customer import Customer
from app.models.task import Task, TaskStatus, TaskType
from app.routes.agency_settings import get_or_create_agency_settings

logger = get_logger(__name__)

_DEFAULT_TEMPLATE = (
    "Happy Birthday {name}! Wishing you a wonderful day from your insurance team."
)


def run_birthday_sweep(db: Session) -> int:
    """Customers with birthday today (UTC calendar day): optional WhatsApp + one task each.

    Returns the number of customers processed.
    """
    today = datetime.now(tz=timezone.utc).date()
    day_start = datetime.combine(today, time.min, tzinfo=timezone.utc)
    day_end = day_start + timedelta(days=1)

    stmt = select(Customer).where(
        Customer.date_of_birth.isnot(None),
        extract("month", Customer.date_of_birth) == today.month,
        extract("day", Customer.date_of_birth) == today.day,
    )
    customers = list(db.scalars(stmt).unique().all())
    settings_cache: dict[int, AgencySettings] = {}

    processed = 0
    for customer in customers:
        aid = customer.agency_id
        if aid not in settings_cache:
            settings_cache[aid] = get_or_create_agency_settings(db, aid)
        agency_settings = settings_cache[aid]

        tmpl_raw = agency_settings.birthday_message_template or _DEFAULT_TEMPLATE
        message = tmpl_raw.replace("{name}", customer.name)

        from_wa = (agency_settings.whatsapp_number or "").strip()
        if not from_wa:
            from_wa = settings.twilio_whatsapp_from

        if customer.phone:
            try:
                send_whatsapp_message(
                    customer.phone,
                    message,
                    from_whatsapp=from_wa or None,
                )
            except Exception:
                logger.exception(
                    "Birthday WhatsApp failed customer_id=%s agency_id=%s",
                    customer.id,
                    aid,
                )

        title = f"Birthday follow-up: {customer.name}"
        exists = db.scalar(
            select(func.count(Task.id)).where(
                Task.agency_id == aid,
                Task.related_id == customer.id,
                Task.type == TaskType.FOLLOWUP,
                Task.title == title,
                Task.due_date >= day_start,
                Task.due_date < day_end,
            )
        )
        if not exists:
            task = Task(
                related_id=customer.id,
                type=TaskType.FOLLOWUP,
                title=title,
                description=None,
                due_date=day_start,
                status=TaskStatus.PENDING,
                agency_id=aid,
            )
            db.add(task)

        processed += 1

    db.commit()
    logger.info("Birthday sweep processed %s customers", processed)
    return processed
