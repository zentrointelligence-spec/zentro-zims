"""Broadcast audience resolution and WhatsApp execution."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import extract, select
from sqlalchemy.orm import Session

from app.integrations.whatsapp import send_whatsapp_message
from app.models.broadcast import Broadcast
from app.models.broadcast_recipient import BroadcastRecipient
from app.models.customer import Customer
from app.models.policy import Policy, PolicyStatus


def get_broadcast_recipients(
    db: Session,
    agency_id: int,
    target_segment: str,
    policy_type_filter: str | None,
) -> list[Customer]:
    """Return distinct customers for the given segment (agency-scoped)."""
    now = datetime.now(timezone.utc)
    month = now.month

    if target_segment == "all":
        stmt = (
            select(Customer)
            .where(Customer.agency_id == agency_id)
            .order_by(Customer.id)
        )
        return list(db.scalars(stmt).all())

    if target_segment == "renewal_due":
        stmt = (
            select(Customer)
            .join(Policy, Policy.customer_id == Customer.id)
            .where(
                Customer.agency_id == agency_id,
                Policy.agency_id == agency_id,
                Policy.status == PolicyStatus.RENEWAL_DUE,
            )
            .distinct()
            .order_by(Customer.id)
        )
        return list(db.scalars(stmt).all())

    if target_segment == "expired":
        stmt = (
            select(Customer)
            .join(Policy, Policy.customer_id == Customer.id)
            .where(
                Customer.agency_id == agency_id,
                Policy.agency_id == agency_id,
                Policy.status == PolicyStatus.EXPIRED,
            )
            .distinct()
            .order_by(Customer.id)
        )
        return list(db.scalars(stmt).all())

    if target_segment == "birthday_this_month":
        stmt = (
            select(Customer)
            .where(
                Customer.agency_id == agency_id,
                Customer.date_of_birth.is_not(None),
                extract("month", Customer.date_of_birth) == month,
            )
            .order_by(Customer.id)
        )
        return list(db.scalars(stmt).all())

    if target_segment == "by_policy_type":
        filt = (policy_type_filter or "").strip()
        if not filt:
            return []
        stmt = (
            select(Customer)
            .join(Policy, Policy.customer_id == Customer.id)
            .where(
                Customer.agency_id == agency_id,
                Policy.agency_id == agency_id,
                Policy.policy_type == filt,
            )
            .distinct()
            .order_by(Customer.id)
        )
        return list(db.scalars(stmt).all())

    return []


def execute_broadcast(db: Session, broadcast_id: int) -> dict:
    """Run a broadcast: recipients, WhatsApp sends, counters, terminal status."""
    broadcast = db.get(Broadcast, broadcast_id)
    if broadcast is None:
        return {"broadcast_id": broadcast_id, "error": "not_found"}

    agency_id = broadcast.agency_id
    if broadcast.status == "draft":
        broadcast.status = "sending"
        db.commit()
        db.refresh(broadcast)

    customers = get_broadcast_recipients(
        db,
        agency_id=agency_id,
        target_segment=broadcast.target_segment,
        policy_type_filter=broadcast.policy_type_filter,
    )
    customer_by_id = {c.id: c for c in customers}

    for cust in customers:
        db.add(
            BroadcastRecipient(
                broadcast_id=broadcast.id,
                customer_id=cust.id,
                phone=cust.phone or "",
                status="pending",
                agency_id=agency_id,
            )
        )
    db.commit()

    recipients = list(
        db.scalars(
            select(BroadcastRecipient)
            .where(BroadcastRecipient.broadcast_id == broadcast.id)
            .order_by(BroadcastRecipient.id)
        ).all()
    )

    sent = 0
    failed = 0
    template = broadcast.message_template or ""

    for rec in recipients:
        cust = customer_by_id.get(rec.customer_id)
        display_name = cust.name if cust else "there"
        personalised = template.replace("{name}", display_name)

        if not (rec.phone or "").strip():
            rec.status = "failed"
            rec.error_message = "Missing phone number"
            failed += 1
            db.commit()
            continue

        try:
            result = send_whatsapp_message(to=rec.phone, body=personalised)
            if result.get("status") == "error":
                rec.status = "failed"
                rec.error_message = str(result.get("error") or "Send failed")
                failed += 1
            else:
                rec.status = "sent"
                rec.sent_at = datetime.now(timezone.utc)
                rec.error_message = None
                sent += 1
        except Exception as exc:  # pragma: no cover - Twilio/network
            rec.status = "failed"
            rec.error_message = str(exc)
            failed += 1
        db.commit()

    broadcast.sent_count = sent
    broadcast.failed_count = failed
    if recipients and sent == 0:
        broadcast.status = "failed"
    else:
        broadcast.status = "sent"
    db.commit()
    db.refresh(broadcast)

    return {
        "broadcast_id": broadcast.id,
        "sent_count": sent,
        "failed_count": failed,
        "status": broadcast.status,
    }
