"""OpenAI-powered sales assistant for insurance conversations."""
from __future__ import annotations

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

SYSTEM_PROMPT = (
    "You are Zentro, a warm, concise, and persuasive insurance sales advisor "
    "for a licensed insurance agency. You chat with prospects over WhatsApp. "
    "Your goals, in order: "
    "(1) acknowledge the customer and build rapport, "
    "(2) understand their needs in 1 short question, "
    "(3) recommend the most relevant policy type (life, health, motor, home, "
    "travel, business) with a brief benefit, "
    "(4) propose a next step — a call with a human agent or sending a quote. "
    "Rules: reply in ≤ 3 short sentences. Never invent specific prices, legal "
    "guarantees, or policy numbers. Never reveal you are an AI. If asked "
    "something you cannot answer, say a human agent will follow up shortly. "
    "Match the customer's language when obvious."
)


def _fallback_reply(user_message: str) -> str:
    """Heuristic reply used when OpenAI is unavailable."""
    msg = (user_message or "").lower().strip()
    if not msg:
        return (
            "Hi! Thanks for reaching out to Zentro Insurance. "
            "Could you tell me what type of cover you're looking for?"
        )
    if any(k in msg for k in ("price", "cost", "quote", "premium")):
        return (
            "Great question — premiums depend on your age, cover amount, "
            "and a couple of quick details. Can I have one of our agents "
            "share a tailored quote today?"
        )
    if any(k in msg for k in ("health", "medical", "hospital")):
        return (
            "Health cover is one of our most-requested plans. "
            "Are you looking for individual or family cover, and any "
            "existing conditions we should account for?"
        )
    if any(k in msg for k in ("car", "motor", "vehicle", "bike")):
        return (
            "We can cover your vehicle with comprehensive or third-party "
            "plans. What's the make, model, and year — I'll line up options?"
        )
    if any(k in msg for k in ("life", "family", "term")):
        return (
            "A term life plan is a smart way to protect your family. "
            "Can I ask your age and the cover amount you had in mind?"
        )
    return (
        "Thanks for the message! I'd love to help. "
        "Could you share what kind of insurance you're exploring so I can "
        "point you to the best plan?"
    )


class AIAssistant:
    """Thin wrapper around OpenAI's chat API with graceful degradation."""

    def __init__(self) -> None:
        self._client = None
        if settings.openai_api_key:
            try:
                # Imported lazily so the app still runs without openai installed
                from openai import OpenAI

                self._client = OpenAI(api_key=settings.openai_api_key)
            except Exception as exc:  # pragma: no cover
                logger.warning("OpenAI client init failed: %s", exc)
                self._client = None

    def generate_reply(
        self,
        user_message: str,
        *,
        history: list[dict[str, str]] | None = None,
    ) -> str:
        """Generate a short, persuasive response.

        Falls back to a heuristic reply if no API key is configured or the call fails.
        """
        if self._client is None:
            logger.info("OpenAI unavailable — using fallback reply.")
            return _fallback_reply(user_message)

        messages: list[dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT}]
        if history:
            messages.extend(history[-8:])
        messages.append({"role": "user", "content": user_message})

        try:
            resp = self._client.chat.completions.create(
                model=settings.openai_model,
                messages=messages,  # type: ignore[arg-type]
                max_tokens=180,
                temperature=0.7,
            )
            text = (resp.choices[0].message.content or "").strip()
            return text or _fallback_reply(user_message)
        except Exception as exc:
            logger.exception("OpenAI call failed: %s", exc)
            return _fallback_reply(user_message)

    def generate_text(
        self,
        *,
        system: str,
        user: str,
        fallback: str,
        max_tokens: int = 220,
    ) -> str:
        """OpenAI chat completion with a custom system/user pair.

        Returns ``fallback`` when the client is unavailable or the call fails.
        """
        if self._client is None:
            logger.info("OpenAI unavailable — using provided fallback text.")
            return fallback

        messages: list[dict[str, str]] = [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ]
        try:
            resp = self._client.chat.completions.create(
                model=settings.openai_model,
                messages=messages,  # type: ignore[arg-type]
                max_tokens=max_tokens,
                temperature=0.65,
            )
            text = (resp.choices[0].message.content or "").strip()
            return text or fallback
        except Exception as exc:  # pragma: no cover
            logger.exception("OpenAI generate_text failed: %s", exc)
            return fallback


ai_assistant = AIAssistant()
