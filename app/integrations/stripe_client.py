"""Stripe SDK wrapper with stub mode when secret key is unset."""
from __future__ import annotations

import json
import logging
import uuid
from types import SimpleNamespace
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)


def _stripe_stub() -> bool:
    return not (settings.stripe_secret_key or "").strip()


def _mock_customer(email: str, name: str | None, agency_id: int) -> Any:
    cid = f"cus_stub_{agency_id}_{uuid.uuid4().hex[:8]}"
    return SimpleNamespace(
        id=cid,
        email=email,
        name=name or "",
        metadata={"agency_id": str(agency_id)},
    )


def _mock_checkout_session() -> Any:
    return SimpleNamespace(
        id=f"cs_stub_{uuid.uuid4().hex[:12]}",
        url="https://stripe.test/checkout_stub",
    )


def _mock_portal_session() -> Any:
    return SimpleNamespace(
        id=f"bps_stub_{uuid.uuid4().hex[:12]}",
        url="https://stripe.test/portal_stub",
    )


def create_customer(email: str, name: str | None, agency_id: int) -> Any:
    """Create a Stripe Customer, or return a stub object when unconfigured."""
    if _stripe_stub():
        logger.info(
            "[Stripe STUB] create_customer email=%s agency_id=%s",
            email,
            agency_id,
        )
        return _mock_customer(email, name, agency_id)

    import stripe

    stripe.api_key = settings.stripe_secret_key
    return stripe.Customer.create(
        email=email,
        name=name or None,
        metadata={"agency_id": str(agency_id)},
    )


def create_checkout_session(
    customer_id: str,
    price_id: str,
    success_url: str,
    cancel_url: str,
    agency_id: int,
    plan: str,
) -> Any:
    """Create a Checkout Session (subscription) with agency metadata."""
    if _stripe_stub():
        logger.info(
            "[Stripe STUB] create_checkout_session customer=%s price=%s",
            customer_id,
            price_id,
        )
        return _mock_checkout_session()

    import stripe

    stripe.api_key = settings.stripe_secret_key
    return stripe.checkout.Session.create(
        customer=customer_id,
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"agency_id": str(agency_id), "plan": plan},
        subscription_data={"metadata": {"agency_id": str(agency_id), "plan": plan}},
    )


def create_portal_session(customer_id: str, return_url: str) -> Any:
    """Create a Billing Portal session."""
    if _stripe_stub():
        logger.info("[Stripe STUB] create_portal_session customer=%s", customer_id)
        return _mock_portal_session()

    import stripe

    stripe.api_key = settings.stripe_secret_key
    return stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=return_url,
    )


def construct_webhook_event(payload: bytes, sig_header: str | None, webhook_secret: str) -> Any:
    """Verify and parse a Stripe webhook event (dict when webhook secret unset — dev only)."""
    secret = (webhook_secret or "").strip()
    if not secret:
        logger.warning(
            "[Stripe STUB] STRIPE_WEBHOOK_SECRET unset; parsing webhook JSON without verification"
        )
        return json.loads(payload.decode("utf-8"))

    import stripe

    return stripe.Webhook.construct_event(
        payload,
        sig_header or "",
        secret,
    )
