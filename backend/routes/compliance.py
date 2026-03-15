import logging
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from services.auth import get_current_user
from services.supabase_client import supabase
from services.audit import audit_event
from services.security import sanitize_ai_output, verify_ownership
from ai_pipeline import compliance_analyze, INDUSTRY_REGULATIONS

router = APIRouter()
logger = logging.getLogger(__name__)


# ── Request/Response Models ───────────────────────────────────────────────────
class ComplianceAnalysisRequest(BaseModel):
    scan_id: str = Field(min_length=3, max_length=128)
    industry: str = Field(min_length=3, max_length=50)


class ComplianceReportResponse(BaseModel):
    report_id: str
    scan_id: str
    industry: str
    overall_score: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    violations: List[dict]
    recommendations: List[str]
    created_at: str


class IndustryInfo(BaseModel):
    industry: str
    regulations: List[str]


# ── Industry Information ───────────────────────────────────────────────────────
@router.get("/compliance/industries")
async def get_industries():
    """Get list of supported industries with their regulations."""
    industries = []
    for industry, regulations in INDUSTRY_REGULATIONS.items():
        industries.append({
            "industry": industry,
            "regulations": regulations
        })
    
    return {
        "success": True,
        "data": industries
    }


# ── Compliance Analysis ────────────────────────────────────────────────────────
@router.post("/compliance/analyze")
async def analyze_compliance(
    payload: ComplianceAnalysisRequest,
    user: dict = Depends(get_current_user)
):
    """Analyze a scan for industry-specific compliance violations."""
    
    # Validate industry
    if payload.industry not in INDUSTRY_REGULATIONS:
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "error": f"Unsupported industry: {payload.industry}",
                "code": "UNSUPPORTED_INDUSTRY"
            }
        )
    
    # Verify scan ownership and get text
    scan = await verify_ownership(
        payload.scan_id,
        user["id"],
        "scans",
        supabase,
        request=user["request"],
        select_fields="id,user_id,raw_text,clean_text,filename",
    )
    raw_text = scan.get("clean_text") or scan.get("raw_text") or ""
    if not raw_text:
        raise HTTPException(status_code=400, detail="No text content found in scan")
    
    # Perform compliance analysis
    try:
        analysis_result = await compliance_analyze(raw_text, payload.industry, payload.scan_id)
    except Exception as e:
        logger.error("compliance.analysis_failed", extra={"error": str(e), "scan_id": payload.scan_id})
        raise HTTPException(status_code=500, detail="Compliance analysis failed")
    
    # Count violations by severity
    violations = analysis_result.get("violations", [])
    critical_count = len([v for v in violations if v.get("severity") == "critical"])
    high_count = len([v for v in violations if v.get("severity") == "high"])
    medium_count = len([v for v in violations if v.get("severity") == "medium"])
    low_count = len([v for v in violations if v.get("severity") == "low"])
    
    # Store compliance report
    report_id = str(uuid.uuid4())
    try:
        supabase.table("compliance_reports").insert({
            "id": report_id,
            "user_id": user["id"],
            "scan_id": payload.scan_id,
            "industry": payload.industry,
            "overall_score": analysis_result.get("overall_score", 0),
            "critical_count": critical_count,
            "high_count": high_count,
            "medium_count": medium_count,
            "low_count": low_count,
            "violations": violations,
            "recommendations": [sanitize_ai_output(str(item), max_length=1000) for item in analysis_result.get("recommendations", [])]
        }).execute()
    except Exception as e:
        logger.error("compliance.report_store_failed", extra={"error": str(e), "report_id": report_id})
        raise HTTPException(status_code=500, detail="Failed to store compliance report")
    
    # Get created timestamp
    report_data = (
        supabase.table("compliance_reports")
        .select("created_at")
        .eq("id", report_id)
        .single()
        .execute()
    )
    created_at = report_data.data.get("created_at") if report_data.data else ""
    
    logger.info(
        "compliance.analysis.completed",
        extra={
            "report_id": report_id,
            "scan_id": payload.scan_id,
            "industry": payload.industry,
            "user_id": user["id"],
            "overall_score": analysis_result.get("overall_score", 0)
        }
    )
    audit_event(
        user["request"],
        event="compliance.analyze",
        outcome="success",
        user_id=user["id"],
        scan_id=payload.scan_id,
        industry=payload.industry,
        report_id=report_id
    )
    
    return {
        "success": True,
        "data": {
            "report_id": report_id,
            "scan_id": payload.scan_id,
            "industry": payload.industry,
            "overall_score": analysis_result.get("overall_score", 0),
            "critical_count": critical_count,
            "high_count": high_count,
            "medium_count": medium_count,
            "low_count": low_count,
            "violations": violations,
            "recommendations": analysis_result.get("recommendations", []),
            "created_at": created_at
        }
    }


# ── Compliance Reports ─────────────────────────────────────────────────────────
@router.get("/compliance/reports")
async def list_compliance_reports(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    user: dict = Depends(get_current_user)
):
    """Get paginated list of user's compliance reports."""
    
    offset = (page - 1) * limit
    
    try:
        # Get reports with pagination
        res = (
            supabase.table("compliance_reports")
            .select("id,scan_id,industry,overall_score,critical_count,high_count,medium_count,low_count,created_at")
            .eq("user_id", user["id"])
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        
        # Get total count for pagination
        count_res = (
            supabase.table("compliance_reports")
            .select("id", count="exact")
            .eq("user_id", user["id"])
            .execute()
        )
        
        total_count = count_res.count or 0
        total_pages = (total_count + limit - 1) // limit
        
        reports = []
        for report in res.data or []:
            reports.append({
                "report_id": report["id"],
                "scan_id": report["scan_id"],
                "industry": report["industry"],
                "overall_score": report["overall_score"],
                "critical_count": report["critical_count"],
                "high_count": report["high_count"],
                "medium_count": report["medium_count"],
                "low_count": report["low_count"],
                "created_at": report["created_at"]
            })
        
        pagination_info = {
            "page": page,
            "limit": limit,
            "total_count": total_count,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }
        
        logger.info(
            "compliance.reports.listed",
            extra={
                "user_id": user["id"],
                "page": page,
                "count": len(reports),
                "total_count": total_count
            }
        )
        
        return {
            "success": True,
            "data": {
                "reports": reports,
                "pagination": pagination_info
            }
        }
        
    except Exception as e:
        logger.error("compliance.reports.list_failed", extra={"error": str(e), "user_id": user["id"]})
        raise HTTPException(status_code=500, detail="Failed to list compliance reports")


@router.get("/compliance/reports/{report_id}")
async def get_compliance_report(report_id: str, user: dict = Depends(get_current_user)):
    """Get full compliance report detail."""
    
    try:
        report = await verify_ownership(
            report_id,
            user["id"],
            "compliance_reports",
            supabase,
            request=user["request"],
        )
        
        # Also get scan filename for context
        scan_info = (
            supabase.table("scans")
            .select("filename,user_id")
            .eq("id", report["scan_id"])
            .eq("user_id", user["id"])
            .limit(1)
            .execute()
        )
        scan_filename = (scan_info.data or [{}])[0].get("filename", "Unknown")
        
        logger.info(
            "compliance.report.viewed",
            extra={
                "report_id": report_id,
                "user_id": user["id"],
                "scan_id": report["scan_id"]
            }
        )
        
        return {
            "success": True,
            "data": {
                "report_id": report["id"],
                "scan_id": report["scan_id"],
                "scan_filename": scan_filename,
                "industry": report["industry"],
                "overall_score": report["overall_score"],
                "critical_count": report["critical_count"],
                "high_count": report["high_count"],
                "medium_count": report["medium_count"],
                "low_count": report["low_count"],
                "violations": report["violations"],
                "recommendations": report["recommendations"],
                "created_at": report["created_at"]
            }
        }
        
    except Exception as e:
        if "not found" in str(e):
            raise HTTPException(status_code=404, detail="Compliance report not found")
        logger.error("compliance.report.get_failed", extra={"error": str(e), "report_id": report_id})
        raise HTTPException(status_code=500, detail="Failed to get compliance report")
