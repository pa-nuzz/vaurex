import re
import os
import uuid
import logging
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from services.auth import get_current_user
from services.supabase_client import supabase
from services.audit import audit_event
from services.job_queue import enqueue_scan_job

router = APIRouter()
logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".tiff"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/tiff",
}

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Sanitize filename
    raw_name = file.filename
    safe_name = re.sub(r'[/\\\x00]', '_', raw_name)[:255]
    ext = os.path.splitext(safe_name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    content_type = file.content_type or "application/octet-stream"
    if content_type != "application/octet-stream" and content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported content type")

    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 20 MB)")

    scan_id = str(uuid.uuid4())

    # Insert initial scan record
    supabase.table("scans").insert({
        "id": scan_id,
        "user_id": user["id"],
        "filename": safe_name,
        "status": "processing",
    }).execute()

    logger.info(
        "scan.created",
        extra={
            "scan_id": scan_id,
            "user_id": user["id"],
            "upload_filename": safe_name,
            "size_bytes": len(content),
        },
    )
    audit_event(
        user["request"],
        event="scan.upload",
        outcome="success",
        user_id=user["id"],
        scan_id=scan_id,
        upload_filename=safe_name,
        size_bytes=len(content),
    )

    # Queue analysis in a durable local queue.
    enqueue_scan_job(
        scan_id=scan_id,
        user_id=user["id"],
        filename=safe_name,
        content_type=content_type,
        content=content,
    )
    return {"scan_id": scan_id}
