import os
import smtplib
from email.message import EmailMessage
from services.config import SUPPORT_EMAIL, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD

def is_support_email_enabled() -> bool:
    """Check if support email is properly configured."""
    return bool(SUPPORT_EMAIL and SMTP_HOST and SMTP_USER and SMTP_PASSWORD)


def send_support_email(subject: str, body: str, reply_to: str | None = None) -> None:
    if not is_support_email_enabled():
        raise RuntimeError("Support email is not configured")

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = SUPPORT_EMAIL
    msg["To"] = SUPPORT_EMAIL
    if reply_to:
        msg["Reply-To"] = reply_to
    msg.set_content(body)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)


def send_user_confirmation_email(recipient: str, request_id: str) -> None:
    if not is_support_email_enabled() or not recipient:
        return

    msg = EmailMessage()
    msg["Subject"] = "Vaurex Support Request Received"
    msg["From"] = SUPPORT_EMAIL
    msg["To"] = recipient
    msg.set_content(
        "We received your support request and will get back to you soon.\n"
        f"Request ID: {request_id}\n\n"
        "Thanks,\nVaurex Support"
    )

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)


def send_login_alert_email(
    recipient: str,
    *,
    provider: str,
    ip_address: str,
    user_agent: str,
) -> None:
    if not is_support_email_enabled() or not recipient:
        return

    provider_name = provider.strip().lower() or "email"
    readable_provider = "Google" if provider_name == "google" else "Email/Password"

    msg = EmailMessage()
    msg["Subject"] = "New login to your Vaurex account"
    msg["From"] = SUPPORT_EMAIL
    msg["To"] = recipient
    msg.set_content(
        "We detected a new login to your Vaurex account.\n\n"
        f"Sign-in method: {readable_provider}\n"
        f"IP address: {ip_address}\n"
        f"Device: {user_agent[:180] if user_agent else 'Unknown device'}\n\n"
        "If this was you, no action is needed.\n"
        "If this wasn't you, reset your password immediately.\n\n"
        "— Vaurex Security"
    )

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
