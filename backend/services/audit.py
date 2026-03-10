import logging
from typing import Any, Optional

from fastapi import Request


audit_logger = logging.getLogger("audit")


def audit_event(
    request: Request,
    event: str,
    outcome: str,
    user_id: Optional[str] = None,
    **details: Any,
) -> None:
    """Write a structured audit event for security-sensitive operations."""
    # Prefix any key that collides with reserved LogRecord attributes.
    _RESERVED = frozenset({
        "args", "created", "exc_info", "exc_text", "filename",
        "funcName", "levelname", "levelno", "lineno", "module",
        "msecs", "msg", "name", "pathname", "process",
        "processName", "relativeCreated", "stack_info", "taskName",
        "thread", "threadName",
    })
    safe_details = {
        (f"detail_{k}" if k in _RESERVED else k): v
        for k, v in details.items()
    }
    audit_logger.info(
        "audit.event",
        extra={
            "event": event,
            "outcome": outcome,
            "user_id": user_id,
            "ip": request.client.host if request.client else "unknown",
            "method": request.method,
            "path": str(request.url.path),
            "user_agent": request.headers.get("user-agent", ""),
            "request_id": getattr(request.state, "request_id", "-"),
            **safe_details,
        },
    )
