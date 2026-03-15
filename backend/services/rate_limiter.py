import asyncio
import logging
import time
import threading
from collections import defaultdict, deque

from datetime import datetime, timedelta, timezone

from services.supabase_client import supabase

logger = logging.getLogger(__name__)


class SlidingWindowRateLimiter:
    """Thread-safe sliding-window in-memory rate limiter."""

    def __init__(self):
        self._events = defaultdict(deque)
        self._lock = threading.Lock()

    def allow(self, key: str, limit: int, window_seconds: int) -> tuple[bool, int, int, int]:
        now = time.time()
        cutoff = now - window_seconds
        reset_at = int(now) + window_seconds

        with self._lock:
            bucket = self._events[key]
            while bucket and bucket[0] <= cutoff:
                bucket.popleft()

            if len(bucket) >= limit:
                retry_after = int(max(1, bucket[0] + window_seconds - now))
                reset_at = int(bucket[0] + window_seconds)
                return False, retry_after, 0, reset_at

            bucket.append(now)
            remaining = max(0, limit - len(bucket))
            if bucket:
                reset_at = int(bucket[0] + window_seconds)
            return True, 0, remaining, reset_at


class PersistentGuestRateLimiter:
    """Best-effort server-side limiter backed by Supabase for guest endpoints."""

    async def allow(self, key: str, limit: int, window_seconds: int) -> tuple[bool, int, int, int]:
        return await asyncio.to_thread(self._allow_blocking, key, limit, window_seconds)

    def _allow_blocking(self, key: str, limit: int, window_seconds: int) -> tuple[bool, int, int, int]:
        now = int(time.time())
        window_start = now - (now % window_seconds)
        reset_at = window_start + window_seconds

        try:
            existing = (
                supabase.table("rate_limit_events")
                .select("id,hits")
                .eq("limiter_key", key)
                .eq("window_start", window_start)
                .limit(1)
                .execute()
            )
            row = (existing.data or [None])[0]

            if row:
                hits = int(row.get("hits") or 0)
                if hits >= limit:
                    return False, max(1, reset_at - now), 0, reset_at
                new_hits = hits + 1
                (
                    supabase.table("rate_limit_events")
                    .update({"hits": new_hits, "reset_at": reset_at})
                    .eq("id", row["id"])
                    .execute()
                )
                return True, 0, max(0, limit - new_hits), reset_at

            (
                supabase.table("rate_limit_events")
                .insert(
                    {
                        "limiter_key": key,
                        "window_start": window_start,
                        "hits": 1,
                        "reset_at": reset_at,
                    }
                )
                .execute()
            )
            return True, 0, max(0, limit - 1), reset_at
        except Exception as exc:
            logger.warning("rate_limit.persistent_fallback", extra={"error": str(exc)})
            return GLOBAL_RATE_LIMITER.allow(key, limit, window_seconds)


GLOBAL_RATE_LIMITER = SlidingWindowRateLimiter()
PERSISTENT_GUEST_RATE_LIMITER = PersistentGuestRateLimiter()


async def check_daily_quota(
    user_id: str,
    action: str,
    limit: int,
    client = supabase,
) -> tuple[bool, int, str]:
    """Supabase-backed per-user daily quota.

    Returns (allowed, used_count, reset_at_iso).
    """
    today = datetime.utcnow().date().isoformat()
    try:
        result = (
            client.table("daily_usage")
            .select("id,count")
            .eq("user_id", user_id)
            .eq("action", action)
            .eq("date", today)
            .limit(1)
            .execute()
        )
        row = result.data[0] if result.data else None
        if row:
            used = int(row.get("count") or 0)
            allowed = used < limit
            if allowed:
                client.table("daily_usage").update({"count": used + 1}).eq("id", row["id"]).execute()
                used += 1
        else:
            # First use today
            client.table("daily_usage").insert(
                {"user_id": user_id, "action": action, "date": today, "count": 1}
            ).execute()
            used = 1
            allowed = used <= limit
    except Exception as exc:
        logger.warning("daily_quota.fallback", extra={"error": str(exc), "user_id": user_id, "action": action})
        # Fallback: allow but indicate zero used to avoid hard-failing user flows.
        allowed = True
        used = 0

    reset_at = (
        datetime.utcnow()
        .replace(hour=0, minute=0, second=0, microsecond=0)
        + timedelta(days=1)
    ).isoformat()
    return allowed, used, reset_at
