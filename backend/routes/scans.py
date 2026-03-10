import logging
from fastapi import APIRouter, Depends, HTTPException
from services.auth import get_current_user
from services.supabase_client import supabase
from services.audit import audit_event

router = APIRouter()
logger = logging.getLogger(__name__)

SCAN_SELECT_FIELDS = "id,filename,status,risk_score,risk_label,summary,entities,flags,error_message,created_at"


def _normalize_scan(scan: dict) -> dict:
    """Return stable API keys even if DB columns differ slightly."""
    return {
        "id": scan.get("id"),
        "filename": scan.get("filename"),
        "status": scan.get("status"),
        "risk_score": scan.get("risk_score", scan.get("score", 0)),
        "risk_label": scan.get("risk_label", scan.get("risk_level", "Unknown")),
        "summary": scan.get("summary", ""),
        "entities": scan.get("entities", []),
        "flags": scan.get("flags", []),
        "error_message": scan.get("error_message"),
        "created_at": scan.get("created_at"),
    }


# ── Private: list user's scans ──────────────────────────────────────────────
@router.get("/scans")
async def list_scans(user: dict = Depends(get_current_user)):
    res = (
        supabase.table("scans")
        .select(SCAN_SELECT_FIELDS)
        .eq("user_id", user["id"])
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    scans = res.data or []
    logger.info(
        "scan.list",
        extra={"user_id": user["id"], "count": len(scans)},
    )
    audit_event(
        user["request"],
        event="scan.list",
        outcome="success",
        user_id=user["id"],
        count=len(scans),
    )
    return [_normalize_scan(scan) for scan in scans]


# ── Private: poll a scan status ──────────────────────────────────────────────
@router.get("/scans/{scan_id}/poll")
async def poll_scan(scan_id: str, user: dict = Depends(get_current_user)):
    res = (
        supabase.table("scans")
        .select(SCAN_SELECT_FIELDS)
        .eq("id", scan_id)
        .eq("user_id", user["id"])
        .single()
        .execute()
    )
    if not res.data:
        logger.warning(
            "scan.poll.not_found",
            extra={"scan_id": scan_id, "user_id": user["id"]},
        )
        audit_event(
            user["request"],
            event="scan.poll",
            outcome="not_found",
            user_id=user["id"],
            scan_id=scan_id,
        )
        raise HTTPException(status_code=404, detail="Scan not found")
    normalized = _normalize_scan(res.data)
    logger.info(
        "scan.poll",
        extra={
            "scan_id": scan_id,
            "user_id": user["id"],
            "status": normalized["status"],
        },
    )
    audit_event(
        user["request"],
        event="scan.poll",
        outcome="success",
        user_id=user["id"],
        scan_id=scan_id,
        status=normalized["status"],
    )
    return normalized
