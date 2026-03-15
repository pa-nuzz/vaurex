import re
import os
import uuid
import hashlib
import logging
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Request
from services.auth import get_current_user
from services.supabase_client import supabase
from services.audit import audit_event
from services.job_queue import enqueue_scan_job
from services.rate_limiter import PERSISTENT_GUEST_RATE_LIMITER, check_daily_quota
from services.utils import ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES
from services.security import (
    GLOBAL_UPLOAD_GATE,
    read_validated_upload,
    request_fingerprint,
)

router = APIRouter()
logger = logging.getLogger(__name__)


async def _check_guest_rate_limit(request: Request) -> None:
    """Check if guest user has exceeded upload limit (3 per day)."""
    key = f"guest_upload:{request_fingerprint(request)}"
    allowed, retry_after, _, _ = await PERSISTENT_GUEST_RATE_LIMITER.allow(key, 3, 86400)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail={
                "success": False,
                "error": "Free limit reached. Create an account to continue.",
                "code": "GUEST_LIMIT_REACHED"
            },
            headers={"Retry-After": str(retry_after)}
        )


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    request: Request = None,
    user: dict = Depends(get_current_user),
):
    return await _handle_upload(file, user, request)


@router.post("/upload/guest")
async def upload_file_guest(
    file: UploadFile = File(...),
    request: Request = None,
):
    """Guest upload endpoint with IP-based rate limiting."""
    await _check_guest_rate_limit(request)
    
    # Create a mock user object for guest
    guest_user = {
        "id": "guest",
        "request": request,
        "is_guest": True
    }
    
    return await _handle_upload(file, guest_user, request)


@router.get("/scans/{scan_id}/poll/guest")
async def poll_scan_guest(scan_id: str, request: Request):
    """Guest polling endpoint for scan status."""
    # Check if this scan exists and is a guest scan by checking job queue
    from services.job_queue import _get_conn
    import sqlite3
    
    with _get_conn() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM jobs WHERE scan_id = ?", (scan_id,))
        job = cursor.fetchone()
        
        if not job:
            raise HTTPException(status_code=404, detail="Scan not found")
        
        # Return job status
        columns = [desc[0] for desc in cursor.description]
        job_dict = dict(zip(columns, job))
        
        return {
            "success": True,
            "data": {
                "scan_id": scan_id,
                "status": job_dict.get("status", "pending"),
                "attempts": job_dict.get("attempts", 0),
                "error_message": job_dict.get("error_message"),
                "created_at": job_dict.get("created_at"),
                "updated_at": job_dict.get("updated_at"),
                "is_guest": True
            }
        }


async def _handle_upload(file: UploadFile, user: dict, request: Request):
    if request is None:
        raise HTTPException(status_code=500, detail="Invalid request")

    scan_id = str(uuid.uuid4())
    # Use a consistent UUID for guest users based on their fingerprint
    if user.get("is_guest"):
        fp = request_fingerprint(request)
        guest_uuid = hashlib.sha256(f"guest-{fp}".encode()).hexdigest()[:32]
        user_id = f"{guest_uuid[:8]}-{guest_uuid[8:12]}-{guest_uuid[12:16]}-{guest_uuid[16:20]}-{guest_uuid[20:]}"
        is_guest = True
    else:
        user_id = user["id"]
        is_guest = False
    
    concurrency_key = f"upload:{user_id}" if not is_guest else f"upload:{request_fingerprint(request)}"

    async with GLOBAL_UPLOAD_GATE.acquire(concurrency_key):
        content, sniffed_mime, display_name, storage_name, size_bytes = await read_validated_upload(
            file,
            ALLOWED_EXTENSIONS,
            ALLOWED_MIME_TYPES,
        )

        # For guest users, store in job queue only, not in scans table
        if is_guest:
            # Don't insert into scans table for guests (no foreign key)
            logger.info(
                "guest_scan.created",
                extra={
                    "scan_id": scan_id,
                    "guest_fingerprint": request_fingerprint(request),
                    "upload_filename": display_name,
                    "storage_filename": storage_name,
                    "size_bytes": size_bytes,
                },
            )
        else:
            # Enforce per-user daily quota for free plans (5 scans/day).
            # Pro plans are handled on the frontend; backend remains conservative.
            allowed, used, reset_at = await check_daily_quota(user_id, "scan", 5, supabase)
            if not allowed:
                raise HTTPException(
                    status_code=429,
                    detail={
                        "detail": "Daily scan limit reached",
                        "limit": 5,
                        "used": used,
                        "resets_at": reset_at,
                    },
                )

            supabase.table("scans").insert({
                "id": scan_id,
                "user_id": user_id,
                "filename": display_name,
                "status": "processing",
            }).execute()

            logger.info(
                "scan.created",
                extra={
                    "scan_id": scan_id,
                    "user_id": user_id,
                    "upload_filename": display_name,
                    "storage_filename": storage_name,
                    "size_bytes": size_bytes,
                    "is_guest": False,
                },
            )

            audit_event(
                user["request"],
                event="scan.upload",
                outcome="success",
                user_id=user["id"],
                scan_id=scan_id,
                upload_filename=display_name,
                size_bytes=size_bytes,
            )

        enqueue_scan_job(
            scan_id=scan_id,
            user_id=user_id,
            filename=storage_name,
            content_type=sniffed_mime,
            content=content,
        )
    
    return {
        "success": True,
        "scan_id": scan_id,
        "data": {
            "scan_id": scan_id,
            "is_guest": is_guest
        }
    }
