"""SendGrid email integration with stub mode when API key is unset."""
from __future__ import annotations

from html import escape

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


def send_email(
    to: str,
    subject: str,
    body_html: str,
    body_text: str | None = None,
) -> dict:
    """Send an email via SendGrid, or log and return stub payload when unconfigured."""
    to_addr = (to or "").strip()
    if not to_addr:
        raise ValueError("Recipient email is required")

    if not (settings.sendgrid_api_key or "").strip():
        logger.info(
            "[Email STUB] to=%s subject=%s text=%s",
            to_addr,
            subject,
            (body_text or "")[:500],
        )
        return {"status": "stub", "to": to_addr}

    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail

        plain = body_text or ""
        message = Mail(
            from_email=(settings.email_from, settings.email_from_name),
            to_emails=to_addr,
            subject=subject,
            plain_text_content=plain,
            html_content=body_html,
        )
        client = SendGridAPIClient(settings.sendgrid_api_key)
        resp = client.send(message)
        logger.info("SendGrid sent to=%s status=%s", to_addr, resp.status_code)
        return {"status": "sent", "to": to_addr, "code": resp.status_code}
    except Exception as exc:  # pragma: no cover
        logger.exception("SendGrid send failed: %s", exc)
        return {"status": "error", "to": to_addr, "error": str(exc)}


def send_renewal_reminder(
    customer_name: str,
    customer_email: str,
    policy_number: str,
    expiry_date,
    agency_name: str,
) -> dict:
    subject = f"Policy renewal reminder — {policy_number}"
    body_html = f"""
    <html><body style="font-family:system-ui,sans-serif;line-height:1.5">
      <p>Hello {escape(customer_name)},</p>
      <p>This is a reminder from <strong>{escape(agency_name)}</strong> that policy
      <strong>{escape(policy_number)}</strong> is due for renewal.</p>
      <p><strong>Expiry date:</strong> {escape(str(expiry_date))}</p>
      <p>Please contact us at your earliest convenience.</p>
    </body></html>
    """
    text = (
        f"Hello {customer_name},\n\n"
        f"Reminder from {agency_name}: policy {policy_number} "
        f"expires on {expiry_date}.\n"
    )
    return send_email(customer_email, subject, body_html, text)


def send_birthday_email(
    customer_name: str,
    customer_email: str,
    agency_name: str,
) -> dict:
    subject = f"Happy Birthday from {agency_name}!"
    body_html = f"""
    <html><body style="font-family:system-ui,sans-serif;line-height:1.5">
      <p>Happy Birthday, {escape(customer_name)}!</p>
      <p>Warm wishes from everyone at <strong>{escape(agency_name)}</strong>.</p>
    </body></html>
    """
    text = f"Happy Birthday, {customer_name}! — {agency_name}"
    return send_email(customer_email, subject, body_html, text)


def send_user_invitation(
    user_name: str,
    user_email: str,
    agency_name: str,
    temp_password: str,
) -> dict:
    subject = f"You've been invited to {agency_name} on Zentro"
    body_html = f"""
    <html><body style="font-family:system-ui,sans-serif;line-height:1.5">
      <p>Hi {escape(user_name)},</p>
      <p>You have been invited to join <strong>{escape(agency_name)}</strong> on Zentro ZIMS.</p>
      <p>Use the Zentro web app to sign in with this email address and the temporary password below.</p>
      <p><strong>Temporary password:</strong> <code>{escape(temp_password)}</code></p>
      <p>Please change your password after your first login.</p>
    </body></html>
    """
    text = (
        f"Hi {user_name},\n\n"
        f"You've been invited to {agency_name} on Zentro.\n"
        f"Temporary password: {temp_password}\n"
    )
    return send_email(user_email, subject, body_html, text)
