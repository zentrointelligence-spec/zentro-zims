"""Stripe billing: status, checkout, portal, and webhooks."""
from __future__ import annotations

import json
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.integrations import stripe_client
from app.integrations.email import send_email
from app.models.agency import Agency
from app.models.lead import Lead
from app.models.policy import Policy
from app.models.user import User, UserRole
from app.schemas.billing import (
    BillingStatusResponse,
    CheckoutRequest,
    CheckoutResponse,
    PlanLimits,
    PlanUsage,
    PortalRequest,
    PortalResponse,
    WebhookAck,
)
from app.services.plan_service import limits_for_plan

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/billing", tags=["billing"])


def _plan_from_price_id(price_id: str | None) -> str:
    g = (settings.stripe_growth_price_id or "").strip()
    p = (settings.stripe_pro_price_id or "").strip()
    if price_id and g and price_id == g:
        return "growth"
    if price_id and p and price_id == p:
        return "pro"
    return "starter"


def _subscription_plan_from_obj(obj: dict[str, Any]) -> str:
    meta = obj.get("metadata") or {}
    if isinstance(meta, dict):
        mp = meta.get("plan")
        if mp in ("starter", "growth", "pro"):
            return mp
    items = obj.get("items")
    data: list[Any] = []
    if isinstance(items, dict):
        data = list(items.get("data") or [])
    pid = None
    if data and isinstance(data[0], dict):
        price = data[0].get("price")
        if isinstance(price, dict):
            pid = price.get("id")
    return _plan_from_price_id(pid)


def _billing_status_from_subscription(obj: dict[str, Any]) -> str:
    st = str(obj.get("status") or "").lower()
    if st in ("active", "trialing"):
        return "active"
    if st in ("past_due", "unpaid"):
        return "past_due"
    if st in ("canceled", "cancelled", "incomplete_expired"):
        return "cancelled"
    return "active"


def _event_payload(event: Any) -> tuple[str | None, dict[str, Any]]:
    if isinstance(event, dict):
        etype = event.get("type")
        raw = (event.get("data") or {}).get("object")
        return etype, raw if isinstance(raw, dict) else {}
    etype = getattr(event, "type", None)
    raw = event["data"]["object"]
    if isinstance(raw, dict):
        return etype, raw
    if hasattr(raw, "to_dict_recursive"):
        return etype, raw.to_dict_recursive()
    if hasattr(raw, "to_dict"):
        return etype, raw.to_dict()
    return etype, {}


def _first_admin_email(db: Session, agency_id: int) -> str | None:
    row = db.scalar(
        select(User.email)
        .where(
            User.agency_id == agency_id,
            User.role == UserRole.ADMIN,
            User.is_active.is_(True),
        )
        .order_by(User.id.asc())
        .limit(1)
    )
    return str(row) if row else None


@router.get("/status", response_model=BillingStatusResponse)
def billing_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BillingStatusResponse:
    agency = db.get(Agency, current_user.agency_id)
    if agency is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Agency not found")

    pl = limits_for_plan(agency.plan)
    users_c = int(
        db.scalar(select(func.count(User.id)).where(User.agency_id == agency.id)) or 0
    )
    leads_c = int(
        db.scalar(select(func.count(Lead.id)).where(Lead.agency_id == agency.id)) or 0
    )
    pol_c = int(
        db.scalar(select(func.count(Policy.id)).where(Policy.agency_id == agency.id))
        or 0
    )
    return BillingStatusResponse(
        plan=agency.plan,
        billing_status=agency.billing_status,
        plan_expires_at=agency.plan_expires_at,
        stripe_customer_id=agency.stripe_customer_id,
        stripe_subscription_id=agency.stripe_subscription_id,
        limits=PlanLimits(
            max_users=pl["max_users"],
            max_leads=pl["max_leads"],
            max_policies=pl["max_policies"],
        ),
        usage=PlanUsage(
            current_users=users_c,
            current_leads=leads_c,
            current_policies=pol_c,
        ),
    )


@router.post("/checkout", response_model=CheckoutResponse)
def billing_checkout(
    payload: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CheckoutResponse:
    agency = db.get(Agency, current_user.agency_id)
    if agency is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Agency not found")

    plan_code = _plan_from_price_id(payload.price_id.strip())

    cid = agency.stripe_customer_id
    if not cid:
        cust = stripe_client.create_customer(
            email=current_user.email,
            name=current_user.name,
            agency_id=agency.id,
        )
        cid = str(cust.id)
        agency.stripe_customer_id = cid
        db.add(agency)
        db.flush()

    session = stripe_client.create_checkout_session(
        customer_id=cid,
        price_id=payload.price_id.strip(),
        success_url=payload.success_url,
        cancel_url=payload.cancel_url,
        agency_id=agency.id,
        plan=plan_code,
    )
    url = getattr(session, "url", None) or (session.get("url") if isinstance(session, dict) else None)
    if not url:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            detail="Checkout session did not return a URL",
        )
    db.commit()
    return CheckoutResponse(checkout_url=str(url))


@router.post("/portal", response_model=PortalResponse)
def billing_portal(
    payload: PortalRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PortalResponse:
    agency = db.get(Agency, current_user.agency_id)
    if agency is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Agency not found")
    if not agency.stripe_customer_id:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="No Stripe customer on file",
        )
    session = stripe_client.create_portal_session(
        customer_id=agency.stripe_customer_id,
        return_url=payload.return_url,
    )
    url = getattr(session, "url", None) or (session.get("url") if isinstance(session, dict) else None)
    if not url:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            detail="Portal session did not return a URL",
        )
    return PortalResponse(portal_url=str(url))


@router.post("/webhook", response_model=WebhookAck)
async def stripe_webhook(request: Request, db: Session = Depends(get_db)) -> WebhookAck:
    body = await request.body()
    sig = request.headers.get("Stripe-Signature")
    try:
        event = stripe_client.construct_webhook_event(
            body,
            sig,
            settings.stripe_webhook_secret,
        )
    except json.JSONDecodeError as exc:
        logger.warning("Webhook invalid JSON: %s", exc)
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, detail="Invalid JSON body"
        ) from exc
    except Exception as exc:  # SignatureVerificationError, ValueError, etc.
        logger.warning("Webhook verification failed: %s", exc)
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, detail="Invalid signature"
        ) from exc

    etype, obj = _event_payload(event)

    if etype == "checkout.session.completed":
        meta = obj.get("metadata") or {}
        try:
            agency_id = int(meta.get("agency_id") or 0)
        except (TypeError, ValueError):
            agency_id = 0
        agency = db.get(Agency, agency_id) if agency_id else None
        if agency:
            plan = meta.get("plan")
            if plan not in ("starter", "growth", "pro"):
                plan = "starter"
            agency.billing_status = "active"
            agency.plan = plan
            agency.stripe_subscription_id = obj.get("subscription")
            agency.plan_expires_at = None
            cid = obj.get("customer")
            if cid and not agency.stripe_customer_id:
                agency.stripe_customer_id = str(cid)
            db.add(agency)

    elif etype == "customer.subscription.updated":
        meta = obj.get("metadata") or {}
        try:
            agency_id = int(meta.get("agency_id") or 0)
        except (TypeError, ValueError):
            agency_id = 0
        sub_id = obj.get("id")
        cust_id = obj.get("customer")
        agency = db.get(Agency, agency_id) if agency_id else None
        if agency is None and cust_id:
            agency = db.scalar(
                select(Agency).where(Agency.stripe_customer_id == str(cust_id))
            )
        if agency is None and sub_id:
            agency = db.scalar(
                select(Agency).where(Agency.stripe_subscription_id == str(sub_id))
            )
        if agency:
            agency.billing_status = _billing_status_from_subscription(obj)
            agency.plan = _subscription_plan_from_obj(obj)
            if sub_id:
                agency.stripe_subscription_id = str(sub_id)
            db.add(agency)

    elif etype == "customer.subscription.deleted":
        sub_id = obj.get("id")
        agency = None
        if sub_id:
            agency = db.scalar(
                select(Agency).where(Agency.stripe_subscription_id == str(sub_id))
            )
        if agency:
            agency.billing_status = "cancelled"
            agency.plan = "starter"
            agency.stripe_subscription_id = None
            db.add(agency)

    elif etype == "invoice.payment_failed":
        inv_customer = obj.get("customer")
        agency = None
        if inv_customer:
            agency = db.scalar(
                select(Agency).where(Agency.stripe_customer_id == str(inv_customer))
            )
        if agency:
            agency.billing_status = "past_due"
            db.add(agency)
            to = _first_admin_email(db, agency.id)
            if to:
                send_email(
                    to,
                    "Payment failed — action required",
                    "<p>We could not process your subscription payment. "
                    "Please update your payment method in the billing portal.</p>",
                    "We could not process your subscription payment. "
                    "Please update your payment method in the billing portal.",
                )

    db.commit()
    return WebhookAck(received=True)
