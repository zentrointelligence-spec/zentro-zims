"""Public webhook endpoints (no JWT required).

The Twilio WhatsApp webhook:
  1. Verifies Twilio signature whenever ``TWILIO_AUTH_TOKEN`` is set; in
     production that token must be configured or requests are rejected.
  2. Resolves agency by inbound ``To`` vs ``Agency.whatsapp_number``.
  3. Looks up (or creates) a Lead for the sender in that agency.
  4. Persists the incoming message as an Interaction.
  5. Generates an AI reply and sends it over WhatsApp.
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.ai.assistant import ai_assistant
from app.core.config import settings
from app.core.database import get_db
from app.core.logging import get_logger
from app.integrations.whatsapp import send_whatsapp_message
from app.models.agency import Agency
from app.models.interaction import Interaction, InteractionDirection
from app.models.lead import Lead, LeadStatus

router = APIRouter(prefix="/webhooks", tags=["webhooks"])
logger = get_logger(__name__)


def _normalize_whatsapp_addr(raw: str) -> str:
    return (raw or "").replace("whatsapp:", "").strip()


def _twilio_params_flat(form: Any) -> dict[str, str]:
    """Build a single-value dict for Twilio signature validation."""
    out: dict[str, str] = {}
    for key in form.keys():
        val = form.get(key)
        if val is not None:
            out[key] = val if isinstance(val, str) else str(val)
    return out


async def _verify_twilio_signature(
    request: Request,
    params: dict[str, str],
    x_twilio_signature: str,
) -> None:
    """Reject requests without a valid Twilio HMAC-SHA1 signature when configured.

    If ``twilio_auth_token`` is set, validation always runs (dev or prod).
    If unset: in **production** return 503; in other envs skip (local only).
    """
    if not settings.twilio_auth_token:
        if settings.app_env == "production":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "Twilio webhook is not configured "
                    "(TWILIO_AUTH_TOKEN required in production)"
                ),
            )
        return

    try:
        from twilio.request_validator import RequestValidator
    except ImportError:  # pragma: no cover
        logger.warning("twilio package not installed — skipping signature check")
        return

    validator = RequestValidator(settings.twilio_auth_token)
    if not validator.validate(str(request.url), params, x_twilio_signature or ""):
        logger.warning("Invalid Twilio signature from %s", request.client)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid Twilio signature",
        )


def _strip_whatsapp_prefix(number: str) -> str:
    return (number or "").replace("whatsapp:", "").strip()


def _resolve_agency_by_to(db: Session, to_raw: str) -> Agency:
    """Resolve tenant from Twilio ``To`` (your WhatsApp inbox number)."""
    to_norm = _normalize_whatsapp_addr(to_raw)
    if to_norm:
        candidates = db.query(Agency).filter(Agency.whatsapp_number.isnot(None)).all()
        for ag in candidates:
            if not ag.whatsapp_number:
                continue
            if _normalize_whatsapp_addr(ag.whatsapp_number) == to_norm:
                return ag
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "No agency configured for this WhatsApp inbox number. "
                "Set Agency.whatsapp_number (PATCH /api/v1/agencies/me as admin)."
            ),
        )

    agency = db.query(Agency).order_by(Agency.id.asc()).first()
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No agency configured to receive webhooks",
        )
    logger.warning(
        "WhatsApp webhook received without To — falling back to agency id=%s (dev only)",
        agency.id,
    )
    return agency


def _get_or_create_lead(db: Session, *, phone: str, name: str, agency_id: int) -> Lead:
    lead = (
        db.query(Lead)
        .filter(Lead.phone == phone, Lead.agency_id == agency_id)
        .first()
    )
    if lead:
        if lead.status == LeadStatus.NEW:
            lead.status = LeadStatus.CONTACTED
        return lead

    lead = Lead(
        name=name or "WhatsApp Lead",
        phone=phone,
        insurance_type="unknown",
        status=LeadStatus.CONTACTED,
        source="whatsapp",
        agency_id=agency_id,
    )
    db.add(lead)
    db.flush()
    return lead


def _build_history(db: Session, lead_id: int) -> list[dict[str, str]]:
    rows = (
        db.query(Interaction)
        .filter(Interaction.lead_id == lead_id)
        .order_by(Interaction.timestamp.asc())
        .limit(10)
        .all()
    )
    return [
        {
            "role": "user" if r.direction == InteractionDirection.INCOMING else "assistant",
            "content": r.message,
        }
        for r in rows
    ]


@router.post("/whatsapp", summary="Twilio WhatsApp incoming-message webhook")
async def whatsapp_webhook(
    request: Request,
    x_twilio_signature: str = Header(default=""),
    db: Session = Depends(get_db),
) -> dict:
    form = await request.form()
    params = _twilio_params_flat(form)
    await _verify_twilio_signature(request, params, x_twilio_signature)

    from_raw = params.get("From", "")
    body_raw = params.get("Body", "")
    profile_name = params.get("ProfileName", "")
    to_raw = params.get("To", "")

    phone = _strip_whatsapp_prefix(from_raw)
    message = (body_raw or "").strip()
    if not phone or not message:
        raise HTTPException(status_code=400, detail="Missing From or Body")

    agency = _resolve_agency_by_to(db, to_raw)
    lead = _get_or_create_lead(
        db, phone=phone, name=profile_name or phone, agency_id=agency.id
    )

    incoming = Interaction(
        lead_id=lead.id,
        message=message,
        direction=InteractionDirection.INCOMING,
        channel="whatsapp",
        agency_id=agency.id,
    )
    db.add(incoming)
    db.flush()

    history = _build_history(db, lead.id)
    reply_text = ai_assistant.generate_reply(message, history=history)

    send_result = send_whatsapp_message(to=phone, body=reply_text)

    outgoing = Interaction(
        lead_id=lead.id,
        message=reply_text,
        direction=InteractionDirection.OUTGOING,
        channel="whatsapp",
        agency_id=agency.id,
    )
    db.add(outgoing)
    db.commit()

    logger.info(
        "Webhook processed: agency=%s lead=%s send_status=%s",
        agency.id,
        lead.id,
        send_result.get("status"),
    )
    return {
        "status": "ok",
        "lead_id": lead.id,
        "reply": reply_text,
        "send_status": send_result.get("status"),
    }
