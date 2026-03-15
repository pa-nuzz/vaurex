import os
from fastapi import Request, HTTPException
from services.supabase_client import supabase
from services.audit import audit_event
from services.rate_limiter import GLOBAL_RATE_LIMITER
from services.config import AUTH_RATE_LIMIT_PER_MIN


async def get_current_user(request: Request) -> dict:
    """Extract and verify the JWT from the Authorization header."""
    client_ip = request.client.host if request.client else "unknown"
    allowed, retry_after, _, _ = GLOBAL_RATE_LIMITER.allow(
        f"auth:{client_ip}",
        AUTH_RATE_LIMIT_PER_MIN,
        60,
    )
    if not allowed:
        audit_event(
            request,
            event="auth.rate_limited",
            outcome="denied",
            retry_after=retry_after,
        )
        raise HTTPException(
            status_code=429,
            detail="Too many authentication requests. Please retry shortly.",
        )

    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        audit_event(request, event="auth.missing_bearer", outcome="denied")
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = auth[7:]
    try:
        res = supabase.auth.get_user(token)
        if not res or not res.user or not getattr(res.user, "id", None):
            audit_event(request, event="auth.invalid_token", outcome="denied")
            raise HTTPException(status_code=401, detail="Invalid token")
        request.state.user_id = res.user.id
        audit_event(
            request,
            event="auth.success",
            outcome="success",
            user_id=res.user.id,
        )
        return {"id": res.user.id, "email": res.user.email, "request": request}
    except HTTPException:
        raise
    except Exception:
        audit_event(request, event="auth.exception", outcome="denied")
        raise HTTPException(status_code=401, detail="Invalid token")
