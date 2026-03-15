import logging
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from services.auth import get_current_user
from services.security import request_ip
from services.supabase_client import supabase
from services.support_mailer import send_login_alert_email, send_password_reset_code_email

router = APIRouter()
logger = logging.getLogger(__name__)


class LoginNotificationPayload(BaseModel):
    provider: str = "email"


class PasswordResetCodePayload(BaseModel):
    email: str


@router.post("/auth/login-notification")
async def login_notification(
    payload: LoginNotificationPayload,
    request: Request,
    user: dict = Depends(get_current_user),
):
    recipient = user.get("email")
    if not recipient:
        return {"success": True, "sent": False}

    try:
        send_login_alert_email(
            recipient,
            provider=payload.provider,
            ip_address=request_ip(request),
            user_agent=request.headers.get("user-agent", ""),
        )
        return {"success": True, "sent": True}
    except Exception as exc:
        logger.warning(
            "auth.login_notification_failed",
            extra={"user_id": user.get("id"), "error": str(exc)},
        )
        return {"success": True, "sent": False}


@router.post("/auth/password-reset/request-code")
async def request_password_reset_code(payload: PasswordResetCodePayload):
    email = (payload.email or "").strip().lower()
    if not email:
        return {"success": True, "sent": False}

    try:
        link_response = supabase.auth.admin.generate_link(
            {
                "type": "recovery",
                "email": email,
            }
        )
        code = link_response.properties.email_otp if link_response and link_response.properties else None
        if code:
            send_password_reset_code_email(email, code=code)
            return {"success": True, "sent": True}
    except Exception as exc:
        logger.warning(
            "auth.password_reset_code_failed",
            extra={"email": email, "error": str(exc)},
        )

    return {"success": True, "sent": False}
