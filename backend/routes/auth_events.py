import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from services.auth import get_current_user
from services.password_reset_codes import consume_code, generate_code, store_code, verify_code
from services.rate_limiter import GLOBAL_RATE_LIMITER
from services.security import request_ip
from services.supabase_client import supabase
from services.support_mailer import send_login_alert_email, send_password_reset_code_email

router = APIRouter()
logger = logging.getLogger(__name__)


class LoginNotificationPayload(BaseModel):
    provider: str = "email"


class PasswordResetCodePayload(BaseModel):
    email: str


class VerifyPasswordResetCodePayload(BaseModel):
    email: str
    code: str = Field(min_length=6, max_length=6)


class CompletePasswordResetPayload(BaseModel):
    email: str
    code: str = Field(min_length=6, max_length=6)
    new_password: str = Field(min_length=6, max_length=128)


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
async def request_password_reset_code(payload: PasswordResetCodePayload, request: Request):
    email = (payload.email or "").strip().lower()
    if not email:
        return {"success": True, "sent": False}

    ip_key = f"pwd-reset:request:ip:{request_ip(request)}"
    allowed, retry_after, _, _ = GLOBAL_RATE_LIMITER.allow(ip_key, 8, 60)
    if not allowed:
        raise HTTPException(status_code=429, detail=f"Too many reset requests. Retry in {retry_after}s")

    email_key = f"pwd-reset:request:email:{email}"
    allowed, retry_after, _, _ = GLOBAL_RATE_LIMITER.allow(email_key, 4, 900)
    if not allowed:
        raise HTTPException(status_code=429, detail=f"Too many reset requests for this email. Retry in {retry_after}s")

    try:
        link_response = supabase.auth.admin.generate_link({"type": "recovery", "email": email})
        user_id = getattr(getattr(link_response, "user", None), "id", None)
        if user_id:
            code = generate_code()
            store_code(email, user_id, code)
            send_password_reset_code_email(email, code=code)
    except Exception as exc:
        logger.warning(
            "auth.password_reset_code_failed",
            extra={"email": email, "error": str(exc)},
        )

    return {"success": True, "sent": True}


@router.post("/auth/password-reset/verify-code")
async def verify_password_reset_code(payload: VerifyPasswordResetCodePayload, request: Request):
    email = (payload.email or "").strip().lower()
    code = (payload.code or "").strip()

    ip_key = f"pwd-reset:verify:ip:{request_ip(request)}"
    allowed, retry_after, _, _ = GLOBAL_RATE_LIMITER.allow(ip_key, 20, 60)
    if not allowed:
        raise HTTPException(status_code=429, detail=f"Too many verification attempts. Retry in {retry_after}s")

    if not verify_code(email, code):
        raise HTTPException(status_code=400, detail="Invalid or expired code")
    return {"success": True, "valid": True}


@router.post("/auth/password-reset/complete")
async def complete_password_reset(payload: CompletePasswordResetPayload, request: Request):
    email = (payload.email or "").strip().lower()
    code = (payload.code or "").strip()

    ip_key = f"pwd-reset:complete:ip:{request_ip(request)}"
    allowed, retry_after, _, _ = GLOBAL_RATE_LIMITER.allow(ip_key, 10, 60)
    if not allowed:
        raise HTTPException(status_code=429, detail=f"Too many reset attempts. Retry in {retry_after}s")

    # Validate code first without consuming it, so we can safely run the
    # same-password check without burning the one-time code on a rejection.
    if not verify_code(email, code):
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    # Reject if the new password is identical to the current one.
    try:
        check = supabase.auth.sign_in_with_password({"email": email, "password": payload.new_password})
        if getattr(getattr(check, "user", None), "id", None):
            raise HTTPException(
                status_code=400,
                detail="New password must be different from your current password",
            )
    except HTTPException:
        raise
    except Exception:
        pass  # Sign-in failure means the passwords differ — proceed normally.

    user_id = consume_code(email, code)
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    try:
        supabase.auth.admin.update_user_by_id(user_id, {"password": payload.new_password})
    except Exception as exc:
        logger.warning(
            "auth.password_reset_complete_failed",
            extra={"email": email, "user_id": user_id, "error": str(exc)},
        )
        raise HTTPException(status_code=500, detail="Failed to reset password")

    return {"success": True}
