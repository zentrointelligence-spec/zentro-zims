"""Twilio WhatsApp integration."""
from __future__ import annotations

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


def _normalize_whatsapp(number: str) -> str:
    """Ensure the destination is in Twilio's `whatsapp:+E164` form."""
    n = (number or "").strip()
    if not n:
        return n
    if n.startswith("whatsapp:"):
        return n
    if not n.startswith("+"):
        n = "+" + n.lstrip("0")
    return f"whatsapp:{n}"


class WhatsAppClient:
    """Thin wrapper around Twilio's REST client with graceful degradation."""

    def __init__(self) -> None:
        self._client = None
        if settings.twilio_account_sid and settings.twilio_auth_token:
            try:
                from twilio.rest import Client

                self._client = Client(
                    settings.twilio_account_sid, settings.twilio_auth_token
                )
            except Exception as exc:  # pragma: no cover
                logger.warning("Twilio client init failed: %s", exc)
                self._client = None

    @property
    def is_configured(self) -> bool:
        return self._client is not None

    def send_whatsapp_message(
        self,
        to: str,
        body: str,
        from_whatsapp: str | None = None,
    ) -> dict:
        """Send a WhatsApp message. Returns a dict with send status.

        In local/dev mode (no Twilio creds), logs and returns a stub payload
        so the rest of the pipeline works end-to-end.

        ``from_whatsapp`` overrides the configured Twilio sender when provided.
        """
        to_norm = _normalize_whatsapp(to)
        if not to_norm:
            raise ValueError("Destination phone number is required")

        from_raw = (from_whatsapp or "").strip() or settings.twilio_whatsapp_from
        from_norm = (
            from_raw
            if from_raw.startswith("whatsapp:")
            else _normalize_whatsapp(from_raw)
        )

        if not self.is_configured:
            logger.info(
                "[WhatsApp STUB] from=%s to=%s body=%s", from_norm, to_norm, body
            )
            return {
                "status": "stub",
                "from": from_norm,
                "to": to_norm,
                "body": body,
                "sid": None,
            }

        try:
            msg = self._client.messages.create(  # type: ignore[union-attr]
                from_=from_norm,
                to=to_norm,
                body=body,
            )
            logger.info("WhatsApp sent sid=%s to=%s", msg.sid, to_norm)
            return {
                "status": msg.status,
                "to": to_norm,
                "body": body,
                "sid": msg.sid,
            }
        except Exception as exc:
            logger.exception("WhatsApp send failed: %s", exc)
            return {"status": "error", "to": to_norm, "body": body, "error": str(exc)}


whatsapp_client = WhatsAppClient()


def send_whatsapp_message(
    to: str,
    body: str,
    from_whatsapp: str | None = None,
) -> dict:
    """Module-level convenience wrapper."""
    return whatsapp_client.send_whatsapp_message(to, body, from_whatsapp=from_whatsapp)
