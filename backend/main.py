import os
import json
import uuid
import time
import logging
import hashlib
from contextlib import asynccontextmanager
from contextvars import ContextVar
from services.config import (
    FRONTEND_URL,
    IS_PRODUCTION,
    validate_frontend_url,
    validate_required_keys,
)

from fastapi import FastAPI, Request, Response, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routes.upload import router as upload_router
from routes.upload import upload_file as upload_v1
from routes.scans import router as scans_router
from routes.scans import list_scans as list_scans_v1
from routes.support import router as support_router
from routes.support_agent import router as support_agent_router
from routes.chat import router as chat_router
from routes.quota import router as quota_router
from routes.knowledge_base import router as kb_router
from routes.compliance import router as compliance_router
from services.rate_limiter import GLOBAL_RATE_LIMITER, PERSISTENT_GUEST_RATE_LIMITER
from services.job_queue import start_job_worker, stop_job_worker
from services.security import request_fingerprint, request_ip
from services.monitoring import setup_monitoring_middleware, log_error_with_context
from services.auth import get_current_user
import psutil
import asyncio

# ── Structured JSON Logging ──────────────────────────────────────────────────

REQUEST_ID_CTX: ContextVar[str] = ContextVar("request_id", default="-")


class _JsonFormatter(logging.Formatter):
    """Emit each log record as a single JSON line with structured extra fields."""

    _SKIP = frozenset({
        "name", "msg", "args", "levelname", "levelno", "pathname", "filename",
        "module", "exc_info", "exc_text", "stack_info", "lineno", "funcName",
        "created", "msecs", "relativeCreated", "thread", "threadName",
        "processName", "process", "message", "taskName",
    })

    def format(self, record: logging.LogRecord) -> str:
        record.message = record.getMessage()
        log: dict = {
            "ts": self.formatTime(record, "%Y-%m-%dT%H:%M:%S"),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.message,
            "request_id": REQUEST_ID_CTX.get("-"),
        }
        for key, val in record.__dict__.items():
            if key not in self._SKIP:
                log[key] = val
        if record.exc_info:
            log["exc"] = self.formatException(record.exc_info)
        return json.dumps(log, default=str)


def _setup_logging() -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(_JsonFormatter())
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(logging.INFO)
    # Silence noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("pypdf").setLevel(logging.ERROR)


_setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    missing_keys = validate_required_keys()
    if missing_keys:
        message = f"Refusing to start with empty required environment variables: {', '.join(missing_keys)}"
        logger.error("startup.missing_env_keys", extra={"missing_keys": missing_keys})
        print(message)
        raise SystemExit(message)

    validate_frontend_url()

    await start_job_worker()
    logger.info(
        "cors.origins.active",
        extra={"origins": sorted(ALLOWED_ORIGINS)},
    )
    try:
        yield
    finally:
        await stop_job_worker()


app = FastAPI(title="Vaurex API", version="3.0.0", lifespan=lifespan)
API_V1_PREFIX = "/api/v1"

# ── CORS ─────────────────────────────────────────────────────────────────────
if IS_PRODUCTION:
    ALLOWED_ORIGINS = {FRONTEND_URL}
else:
    ALLOWED_ORIGINS = {FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001", "http://192.168.1.66:3000"}
app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(ALLOWED_ORIGINS),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request ID + access log ───────────────────────────────────────────────────
@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    req_id = str(uuid.uuid4())
    REQUEST_ID_CTX.set(req_id)
    request.state.request_id = req_id
    start = time.monotonic()
    try:
        response: Response = await call_next(request)
    except Exception:
        logger.exception(
            "unhandled_exception",
            extra={"path": str(request.url.path)},
        )
        raise
    duration_ms = round((time.monotonic() - start) * 1000)
    logger.info(
        "http.request",
        extra={
            "method": request.method,
            "path": str(request.url.path),
            "status_code": response.status_code,
            "duration_ms": duration_ms,
        },
    )
    if response.status_code in {403, 404, 429}:
        logger.warning(
            "http.security_response",
            extra={
                "method": request.method,
                "path": str(request.url.path),
                "status_code": response.status_code,
                "ip": request_ip(request),
            },
        )
    elif response.status_code >= 500:
        logger.error(
            "http.server_error",
            extra={
                "method": request.method,
                "path": str(request.url.path),
                "status_code": response.status_code,
                "ip": request_ip(request),
            },
        )
    response.headers["X-Request-ID"] = req_id
    return response


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    path = request.url.path
    method = request.method.upper()

    limit = None
    window = 60
    if method == "POST" and path in {"/upload", f"{API_V1_PREFIX}/upload"}:
        limit = int(os.getenv("UPLOAD_RATE_LIMIT_PER_MIN", "12"))
    elif method == "GET" and path.startswith(("/scans", f"{API_V1_PREFIX}/scans")):
        limit = int(os.getenv("SCANS_RATE_LIMIT_PER_MIN", "120"))
    elif method == "DELETE" and path.startswith(("/scans", f"{API_V1_PREFIX}/scans")):
        limit = int(os.getenv("SCANS_DELETE_RATE_LIMIT_PER_MIN", "60"))
    elif method == "POST" and path in {f"{API_V1_PREFIX}/chat", f"{API_V1_PREFIX}/chat/stream"}:
        limit = int(os.getenv("CHAT_RATE_LIMIT_PER_MIN", "45"))
    elif method == "POST" and path in {f"{API_V1_PREFIX}/support", f"{API_V1_PREFIX}/support/report-analysis"}:
        limit = int(os.getenv("SUPPORT_RATE_LIMIT_PER_MIN", "20"))
    elif method == "POST" and path.startswith(f"{API_V1_PREFIX}/kb/collections") and "/documents" in path:
        limit = 10  # KB upload rate limit
    elif method == "POST" and path.startswith(f"{API_V1_PREFIX}/kb/collections") and "/chat" in path:
        limit = 30  # KB chat rate limit
    elif method == "POST" and path == f"{API_V1_PREFIX}/compliance/analyze":
        limit = 5   # Compliance analyze rate limit
    elif method == "POST" and path == f"{API_V1_PREFIX}/agent/chat":
        limit = 10  # Support agent chat rate limit

    if limit is not None:
        auth = request.headers.get("Authorization", "")
        fingerprint = request_fingerprint(request)
        if auth:
            auth_hash = hashlib.sha256(auth.encode("utf-8")).hexdigest()[:24]
            key = f"auth:{method}:{path}:{fingerprint}:{auth_hash}"
            allowed, retry_after, remaining, reset_at = GLOBAL_RATE_LIMITER.allow(key, limit, window)
        else:
            key = f"guest:{method}:{path}:{fingerprint}"
            allowed, retry_after, remaining, reset_at = await PERSISTENT_GUEST_RATE_LIMITER.allow(key, limit, window)

        if not allowed:
            req_id = getattr(request.state, "request_id", "-")
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded. Please retry shortly.",
                    "request_id": req_id,
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-Request-ID": req_id,
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(reset_at),
                },
            )

        request.state.rate_limit = {
            "limit": limit,
            "remaining": remaining,
            "reset_at": reset_at,
        }

    response = await call_next(request)
    if hasattr(request.state, "rate_limit"):
        rate = request.state.rate_limit
        response.headers["X-RateLimit-Limit"] = str(rate["limit"])
        response.headers["X-RateLimit-Remaining"] = str(rate["remaining"])
        response.headers["X-RateLimit-Reset"] = str(rate["reset_at"])
    return response


_SUSPICIOUS_UA_MARKERS = (
    "python-requests",
    "curl/",
    "wget/",
    "scrapy",
    "selenium",
    "headless",
    "phantomjs",
    "httpclient",
    "postmanruntime",
)


@app.middleware("http")
async def suspicious_traffic_middleware(request: Request, call_next):
    path = request.url.path
    user_agent = (request.headers.get("user-agent") or "").lower()
    referer = request.headers.get("referer", "")
    origin = request.headers.get("origin", "")
    method = request.method.upper()

    suspicious = any(marker in user_agent for marker in _SUSPICIOUS_UA_MARKERS)
    sensitive_path = path.startswith(("/upload", "/scans", API_V1_PREFIX))
    if sensitive_path and suspicious:
        logger.warning(
            "traffic.suspicious_user_agent",
            extra={
                "path": path,
                "method": method,
                "user_agent": user_agent,
                "referer": referer,
                "origin": origin,
            },
        )

    return await call_next(request)


# ── Security Headers ──────────────────────────────────────────────────────────
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if IS_PRODUCTION:
        csp = (
            "default-src 'none'; "
            "connect-src 'self' https://iakwmgndlueoyzikhviz.supabase.co; "
            "frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
        )
    else:
        # Relaxed policy for local development to allow frontend-backend communication.
        csp = (
            "default-src 'none'; "
            "connect-src 'self' http://localhost:3000 http://localhost:8000 "
            "http://127.0.0.1:8000 https://iakwmgndlueoyzikhviz.supabase.co; "
            "frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
        )
    response.headers["Content-Security-Policy"] = csp
    response.headers["Cache-Control"] = "no-store"
    if IS_PRODUCTION:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    return response


# ── Routes ────────────────────────────────────────────────────────────────────
# Register routers with proper prefixes (no duplicate registrations)
app.include_router(upload_router, prefix=API_V1_PREFIX)
app.include_router(scans_router, prefix=API_V1_PREFIX)
app.include_router(support_router, prefix=API_V1_PREFIX)
app.include_router(chat_router, prefix=API_V1_PREFIX)
app.include_router(kb_router, prefix=API_V1_PREFIX)
app.include_router(compliance_router, prefix=API_V1_PREFIX)
app.include_router(support_agent_router, prefix=API_V1_PREFIX)
app.include_router(quota_router, prefix=API_V1_PREFIX)

# Legacy compatibility aliases for existing clients and tests.
@app.post("/upload", include_in_schema=False)
async def upload_legacy_alias(
    file: UploadFile = File(...),
    request: Request = None,
    user: dict = Depends(get_current_user),
):
    return await upload_v1(file=file, request=request, user=user)


@app.get("/scans", include_in_schema=False)
async def list_scans_legacy_alias(user: dict = Depends(get_current_user)):
    return await list_scans_v1(user=user)

# Setup monitoring and metrics
setup_monitoring_middleware(app)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    req_id = getattr(request.state, "request_id", "-")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "request_id": req_id},
        headers={"X-Request-ID": req_id},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", "-")
    logger.exception(
        "unhandled_exception.response",
        extra={"path": str(request.url.path), "request_id": req_id},
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "request_id": req_id},
        headers={"X-Request-ID": req_id},
    )


@app.get("/api/v1/health")
async def health_v1():
    import datetime
    import psutil
    
    # System metrics
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    return {
        "status": "ok",
        "version": "3.0.0",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "system": {
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "memory_available_gb": round(memory.available / (1024**3), 2),
            "disk_percent": disk.percent,
            "disk_free_gb": round(disk.free / (1024**3), 2),
        },
        "endpoints": {
            "upload": "/api/v1/upload",
            "scans": "/api/v1/scans",
            "chat": "/api/v1/chat",
            "compliance": "/api/v1/compliance",
            "knowledge_base": "/api/v1/kb",
        }
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/")
async def root():
    return {"service": "Vaurex API", "status": "ok", "version": "3.0.0"}
