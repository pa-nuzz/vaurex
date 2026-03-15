import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from services.auth import get_current_user
from services.supabase_client import supabase
from services.audit import audit_event
from services.security import verify_ownership

router = APIRouter()
logger = logging.getLogger(__name__)

SCAN_SELECT_FIELDS = "id,filename,status,risk_score,risk_label,summary,entities,flags,error_message,clean_text,created_at"
SCAN_DOWNLOAD_FIELDS = SCAN_SELECT_FIELDS + ",raw_text"


def _normalize_scan(scan: dict) -> dict:
    """Return stable API keys even if DB columns differ slightly."""
    # Normalize status: 'completed' -> 'done', 'failure' -> 'failed'
    raw_status = scan.get("status", "processing")
    status_map = {"completed": "done", "failure": "failed"}
    status = status_map.get(raw_status, raw_status)
    return {
        "id": scan.get("id"),
        "filename": scan.get("filename"),
        "status": status,
        "risk_score": scan.get("risk_score", scan.get("score", 0)),
        "risk_label": scan.get("risk_label", scan.get("risk_level", "Unknown")),
        "summary": scan.get("summary", ""),
        "entities": scan.get("entities", []),
        "flags": scan.get("flags", []),
        "error_message": scan.get("error_message"),
        "clean_text": scan.get("clean_text") or scan.get("raw_text") or "",
        "created_at": scan.get("created_at"),
    }


# ── Private: get user's scan statistics ────────────────────────────────────
@router.get("/scans/stats")
async def get_scan_stats(user: dict = Depends(get_current_user)):
    # Get total documents count
    total_res = (
        supabase.table("scans")
        .select("id", count="exact")
        .eq("user_id", user["id"])
        .execute()
    )
    total_documents = total_res.count or 0
    
    # Get average risk score (only completed scans - support both 'done' and 'completed' status)
    avg_res = (
        supabase.table("scans")
        .select("risk_score")
        .eq("user_id", user["id"])
        .in_("status", ["done", "completed"])
        .not_.is_("risk_score", "null")
        .execute()
    )
    
    if avg_res.data:
        risk_scores = [scan["risk_score"] for scan in avg_res.data if scan["risk_score"] is not None]
        average_risk = sum(risk_scores) / len(risk_scores) if risk_scores else 0
        high_risk_count = len([score for score in risk_scores if score >= 56])  # High + Critical
        high_risk_share = (high_risk_count / len(risk_scores) * 100) if risk_scores else 0
    else:
        average_risk = 0
        high_risk_share = 0
    
    stats = {
        "total_documents": total_documents,
        "average_risk": round(average_risk, 1),
        "high_risk_share": round(high_risk_share, 1)
    }
    
    logger.info(
        "scan.stats",
        extra={"user_id": user["id"], "stats": stats},
    )
    audit_event(
        user["request"],
        event="scan.stats",
        outcome="success",
        user_id=user["id"],
        stats=stats,
    )
    return {"success": True, "data": stats}


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
    normalized = _normalize_scan(
        await verify_ownership(
            scan_id,
            user["id"],
            "scans",
            supabase,
            request=user["request"],
            select_fields=SCAN_SELECT_FIELDS + ",user_id",
        )
    )
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


@router.delete("/scans/{scan_id}")
async def delete_scan(scan_id: str, user: dict = Depends(get_current_user)):
    await verify_ownership(scan_id, user["id"], "scans", supabase, request=user["request"])

    supabase.table("scans").delete().eq("id", scan_id).eq("user_id", user["id"]).execute()
    audit_event(
        user["request"],
        event="scan.delete",
        outcome="success",
        user_id=user["id"],
        scan_id=scan_id,
    )
    return {"success": True, "data": {"scan_id": scan_id}}


@router.delete("/scans")
async def clear_scan_history(user: dict = Depends(get_current_user)):
    supabase.table("scans").delete().eq("user_id", user["id"]).execute()
    audit_event(
        user["request"],
        event="scan.clear_history",
        outcome="success",
        user_id=user["id"],
    )
    return {"success": True, "data": {}}


@router.get("/scans/{scan_id}/download/text")
async def download_scan_text(scan_id: str, user: dict = Depends(get_current_user)):
    scan = await verify_ownership(
        scan_id,
        user["id"],
        "scans",
        supabase,
        request=user["request"],
        select_fields=SCAN_DOWNLOAD_FIELDS + ",user_id",
    )
    text_body = scan.get("clean_text") or scan.get("raw_text") or ""
    filename = (scan.get("filename") or "document").rsplit(".", 1)[0]
    audit_event(
        user["request"],
        event="scan.download_text",
        outcome="success",
        user_id=user["id"],
        scan_id=scan_id,
    )
    return PlainTextResponse(
        text_body,
        headers={"Content-Disposition": f'attachment; filename="{filename}-extracted.txt"'},
    )


@router.get("/scans/{scan_id}/download/report")
async def download_scan_report(scan_id: str, user: dict = Depends(get_current_user)):
    scan = _normalize_scan(
        await verify_ownership(
            scan_id,
            user["id"],
            "scans",
            supabase,
            request=user["request"],
            select_fields=SCAN_DOWNLOAD_FIELDS + ",user_id",
        )
    )
    payload = {
        "id": scan.get("id"),
        "filename": scan.get("filename"),
        "status": scan.get("status"),
        "risk_score": scan.get("risk_score"),
        "risk_label": scan.get("risk_label"),
        "summary": scan.get("summary"),
        "entities": scan.get("entities") or [],
        "flags": scan.get("flags") or [],
        "created_at": scan.get("created_at"),
    }
    filename = (scan.get("filename") or "document").rsplit(".", 1)[0]
    audit_event(
        user["request"],
        event="scan.download_report",
        outcome="success",
        user_id=user["id"],
        scan_id=scan_id,
    )
    return payload | {"download_filename": f"{filename}-ai-report.json"}
