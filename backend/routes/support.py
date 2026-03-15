import asyncio
import logging
import re
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from fastapi import APIRouter, Depends, HTTPException

from services.auth import get_current_user
from services.supabase_client import supabase
from services.audit import audit_event
from services.support_mailer import (
    send_support_email,
    send_user_confirmation_email,
    is_support_email_enabled,
)
from services.security import MAX_MESSAGE_LENGTH, MAX_NAME_LENGTH, sanitize_text_input, verify_ownership

router = APIRouter()
logger = logging.getLogger(__name__)

_EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class SupportRequest(BaseModel):
    # Accept either subject or name (test uses name field)
    subject: Optional[str] = Field(default=None, max_length=200)
    name: Optional[str] = Field(default=None, max_length=200)
    message: str = Field(min_length=2, max_length=MAX_MESSAGE_LENGTH)
    email: Optional[str] = Field(default=None, min_length=5, max_length=200)
    send_confirmation: Optional[bool] = Field(default=False)

    @field_validator("email")
    @classmethod
    def email_format(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        email = value.strip().lower()
        if not _EMAIL_REGEX.match(email):
            raise ValueError("Invalid email address")
        return email


class ReportIncorrectAnalysisRequest(BaseModel):
    # Accept both scan_id and document_id (test uses document_id)
    scan_id: Optional[str] = Field(default=None, max_length=128)
    document_id: Optional[str] = Field(default=None, max_length=128)
    message: Optional[str] = Field(default=None, max_length=MAX_MESSAGE_LENGTH)
    complaint: Optional[str] = Field(default=None, max_length=MAX_MESSAGE_LENGTH)

    def get_scan_id(self) -> str:
        sid = self.scan_id or self.document_id or ""
        if not sid:
            raise ValueError("scan_id or document_id is required")
        return sid

    def get_message(self) -> str:
        return self.message or self.complaint or ""


@router.post("/support")
async def send_support(payload: SupportRequest, user: dict = Depends(get_current_user)):
    from services.config import SMTP_HOST
    import os
    logger.info(
        "support.email_config_check",
        extra={
            "RESEND_API_KEY_exists": bool(os.getenv("RESEND_API_KEY", "").strip()),
            "SMTP_HOST_exists": bool(SMTP_HOST),
        },
    )
    request_id = getattr(user["request"].state, "request_id", "-")
    subject = sanitize_text_input(
        payload.subject or payload.name or "Support Request", MAX_NAME_LENGTH, "Subject"
    )
    message = sanitize_text_input(payload.message, MAX_MESSAGE_LENGTH, "Message")
    
    try:
        supabase.table("support_logs").insert({
            "user_id": user["id"],
            "subject": subject,
            "message": message,
            "email": payload.email,
            "status": "received"
        }).execute()
    except Exception as e:
        logger.error("support.db_insert_failed", extra={"request_id": request_id, "error": str(e)})
    
    if is_support_email_enabled():
        body = (
            f"Request ID: {request_id}\n"
            f"User ID: {user['id']}\n"
            f"Email: {payload.email or 'Not provided'}\n"
            f"Subject: {subject}\n\n"
            "Message:\n"
            f"{message}\n"
        )
        try:
            await asyncio.to_thread(send_support_email, subject, body, payload.email)
            logger.info("support.send.success", extra={"request_id": request_id, "user_id": user["id"]})
        except Exception:
            logger.exception("support.send.failed", extra={"request_id": request_id, "user_id": user["id"]})

        try:
            if payload.email and payload.send_confirmation:
                await asyncio.to_thread(send_user_confirmation_email, payload.email, request_id)
        except Exception:
            logger.exception("support.confirmation.failed", extra={"request_id": request_id})
    
    audit_event(user["request"], event="support.send", outcome="success", user_id=user["id"])
    return {"ok": True, "success": True, "data": {"request_id": request_id}}


@router.post("/support/report-analysis")
async def report_incorrect_analysis(payload: ReportIncorrectAnalysisRequest, user: dict = Depends(get_current_user)):
    request_id = getattr(user["request"].state, "request_id", "-")
    
    scan_id = payload.get_scan_id()
    scan = await verify_ownership(
        scan_id,
        user["id"],
        "scans",
        supabase,
        request=user["request"],
        select_fields="id,user_id,filename,summary,risk_score,risk_label,flags",
    )
    message = sanitize_text_input(payload.get_message(), MAX_MESSAGE_LENGTH, "Message")
    
    # Log to support_logs table first
    try:
        supabase.table("support_logs").insert({
            "user_id": user["id"],
            "scan_id": payload.scan_id,
            "subject": f"Incorrect Analysis Report - {payload.scan_id}",
            "message": message,
            "status": "received"
        }).execute()
    except Exception as e:
        logger.error("support.db_insert_failed", extra={"request_id": request_id, "error": str(e)})
    
    # Try to send email if enabled
    if is_support_email_enabled():
        subject = f"[Vaurex Report] Incorrect AI Analysis {request_id}"
        body = (
            f"Request ID: {request_id}\n"
            f"User ID: {user['id']}\n"
            f"Document ID: {scan.get('id')}\n"
            f"Filename: {scan.get('filename')}\n"
            f"Risk Score: {scan.get('risk_score')}\n"
            f"Risk Label: {scan.get('risk_label')}\n"
            f"Summary: {scan.get('summary')}\n"
            f"Flags: {scan.get('flags')}\n\n"
            "Complaint:\n"
            f"{message}\n"
        )
        
        try:
            await asyncio.to_thread(send_support_email, subject, body)
            logger.info("support.report_analysis.success", extra={"request_id": request_id, "user_id": user["id"], "scan_id": payload.scan_id})
        except Exception:
            logger.exception("support.report_analysis.failed", extra={"request_id": request_id, "user_id": user["id"], "scan_id": payload.scan_id})
            # Don't fail the request - just log it
    
    audit_event(user["request"], event="support.report_analysis", outcome="success", user_id=user["id"], scan_id=payload.scan_id)
    return {"success": True, "data": {"request_id": request_id}}
