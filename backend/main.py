import os
import json
import uuid
import time
import logging
import hashlib
from contextlib import asynccontextmanager
from contextvars import ContextVar
from dotenv import load_dotenv

if os.getenv("ENV", "development").lower() != "production":
    load_dotenv()

from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routes.upload import router as upload_router
from routes.scans import router as scans_router
from services.rate_limiter import GLOBAL_RATE_LIMITER
from services.job_queue import start_job_worker, stop_job_worker

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

# ── CORS ─────────────────────────────────────────────────────────────────────
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
ALLOWED_ORIGINS = {FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"}
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
    response.headers["X-Request-ID"] = req_id
    return response


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    path = request.url.path
    method = request.method.upper()

    limit = None
    window = 60
    if method == "POST" and path == "/upload":
        limit = int(os.getenv("UPLOAD_RATE_LIMIT_PER_MIN", "12"))
    elif method == "GET" and path.startswith("/scans"):
        limit = int(os.getenv("SCANS_RATE_LIMIT_PER_MIN", "120"))

    if limit is not None:
        auth = request.headers.get("Authorization", "")
        auth_key = hashlib.sha256(auth.encode()).hexdigest()[:16] if auth else "anon"
        ip = request.client.host if request.client else "unknown"
        key = f"{method}:{path}:{ip}:{auth_key}"
        allowed, retry_after = GLOBAL_RATE_LIMITER.allow(key, limit, window)
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
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none'"
    return response


# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(upload_router)
app.include_router(scans_router)


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


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/")
async def root():
    return {"service": "Vaurex API", "status": "ok", "version": "3.0.0"}
