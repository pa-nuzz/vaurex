import logging
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends

from services.auth import get_current_user
from services.supabase_client import supabase

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/quota")
async def get_quota(user: dict = Depends(get_current_user)):
  user_id = user["id"]

  # Resolve user's plan from auth metadata
  try:
    user_res = supabase.auth.admin.get_user_by_id(user_id)
    metadata = (user_res.user.user_metadata or {}) if user_res and user_res.user else {}
  except Exception:
    logger.warning("quota.plan_lookup_failed", extra={"user_id": user_id}, exc_info=True)
    metadata = {}
  plan = str(metadata.get("plan", "free")).lower()
  is_pro = "pro" in plan

  if is_pro:
    return {
      "plan": plan,
      "scans_used": 0,
      "scans_limit": -1,
      "chat_used": 0,
      "chat_limit": -1,
      "resets_at": None,
    }

  # Free plan — compute today's usage from daily_usage table, falling back to 0.
  today = datetime.now(timezone.utc).date().isoformat()

  scans_result = (
    supabase.table("daily_usage")
    .select("count")
    .eq("user_id", user_id)
    .eq("action", "scan")
    .eq("date", today)
    .execute()
  )
  scans_used = scans_result.data[0]["count"] if scans_result.data else 0

  chat_result = (
    supabase.table("daily_usage")
    .select("count")
    .eq("user_id", user_id)
    .eq("action", "chat")
    .eq("date", today)
    .execute()
  )
  chat_used = chat_result.data[0]["count"] if chat_result.data else 0

  tomorrow_midnight = (
    datetime.now(timezone.utc)
    .replace(hour=0, minute=0, second=0, microsecond=0)
    + timedelta(days=1)
  )

  payload = {
    "plan": "free",
    "scans_used": scans_used,
    "scans_limit": 5,
    "chat_used": chat_used,
    "chat_limit": 6,
    "resets_at": tomorrow_midnight.isoformat(),
  }

  logger.info("quota.free_user", extra={"user_id": user_id, **payload})
  return payload

