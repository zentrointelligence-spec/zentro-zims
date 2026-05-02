"""AI-generated marketing and messaging copy (agency-scoped, authenticated)."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.ai.assistant import ai_assistant
from app.core.dependencies import get_current_user
from app.core.logging import get_logger
from app.models.user import User
from app.schemas.ai_content import AIGenerateRequest, AIGenerateResponse

logger = get_logger(__name__)

router = APIRouter(prefix="/ai", tags=["ai"])


def _fallback_for_type(gen_type: str, ctx) -> str:
    platform = (ctx.platform or "whatsapp").strip()
    name = (ctx.customer_name or "there").strip() or "there"
    policy_number = (ctx.policy_number or "your policy").strip()
    expiry = (ctx.expiry_date or "soon").strip()
    ptype = (ctx.policy_type or "insurance").strip()
    insurer = (ctx.insurer or "your insurer").strip()
    premium = (ctx.premium or "the quoted premium").strip()

    if gen_type == "marketing_post":
        return (
            f"Stay protected year-round — review your {ptype} cover on {platform} "
            f"and message us for a quick renewal check. #Insurance #PeaceOfMind"
        )[:280]
    if gen_type == "renewal_message":
        return (
            f"Hi {name}, friendly reminder: policy {policy_number} is due for renewal "
            f"before {expiry}. Reply here and we will handle the paperwork."
        )
    if gen_type == "birthday_wish":
        return (
            f"Happy birthday, {name}! Wishing you a wonderful year ahead — "
            f"your agent team at Zentro."
        )
    if gen_type == "quote_summary":
        return (
            f"Quote summary — Type: {ptype}; Insurer: {insurer}; Premium: {premium}. "
            f"Reply YES to proceed or ask any question."
        )
    if gen_type == "follow_up_message":
        return (
            f"Hi {name}, thanks for your interest in {ptype}. "
            f"Would a quick call tomorrow work to answer your questions?"
        )
    return "Thanks for using Zentro — your agent will follow up shortly."


def _build_prompts(gen_type: str, ctx) -> tuple[str, str]:
    system = (
        "You write concise, professional insurance agency copy for WhatsApp and social. "
        "No legal guarantees, no invented policy numbers beyond what the user supplied. "
        "Keep tone warm and trustworthy."
    )
    if gen_type == "marketing_post":
        platform = ctx.platform or "whatsapp"
        user = (
            f"Write a short professional social post for an insurance agency. "
            f"Platform: {platform}. Topic: awareness, renewal reminders, or policy benefits. "
            f"Under 280 characters if platform is whatsapp."
        )
    elif gen_type == "renewal_message":
        user = (
            f"Write a warm professional WhatsApp renewal reminder for {ctx.customer_name or 'the customer'}. "
            f"Policy {ctx.policy_number or 'number on file'} expires on {ctx.expiry_date or 'the stated date'}. "
            f"Max 3 sentences."
        )
    elif gen_type == "birthday_wish":
        user = (
            f"Warm birthday message for {ctx.customer_name or 'the customer'} from their insurance agent. "
            f"Professional but friendly. Max 2 sentences."
        )
    elif gen_type == "quote_summary":
        user = (
            "Summarise this quote in a concise WhatsApp message:\n"
            f"Policy type: {ctx.policy_type}\n"
            f"Insurer: {ctx.insurer}\n"
            f"Premium: {ctx.premium}\n"
        )
    elif gen_type == "follow_up_message":
        user = (
            f"Friendly follow-up WhatsApp for lead {ctx.customer_name or 'there'} "
            f"who showed interest in {ctx.policy_type or 'insurance'}. Max 3 sentences."
        )
    else:
        user = "Provide a short helpful insurance agency message."
    return system, user


@router.post("/generate", response_model=AIGenerateResponse)
def generate_ai_content(
    body: AIGenerateRequest,
    current_user: User = Depends(get_current_user),
) -> AIGenerateResponse:
    ctx = body.context
    fb = _fallback_for_type(body.type, ctx)
    system, user = _build_prompts(body.type, ctx)
    content = ai_assistant.generate_text(system=system, user=user, fallback=fb)

    logger.info(
        "ai_content_generate agency_id=%s user_id=%s type=%s",
        current_user.agency_id,
        current_user.id,
        body.type,
    )

    return AIGenerateResponse(
        type=body.type,
        content=content,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )
