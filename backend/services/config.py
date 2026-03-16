"""Shared environment configuration for Vaurex backend."""

from typing import List
import os
from urllib.parse import urlparse

from dotenv import load_dotenv

if os.getenv("ENV", "development").lower() != "production":
    load_dotenv()


def _as_bool(value: str | None) -> bool:
    if value is None:
        return False
    return value.strip().lower() in {"1", "true", "yes", "on"}


_legacy_is_production = _as_bool(os.getenv("IS_PRODUCTION"))
_env_raw = os.getenv("ENV", "").strip().lower()
ENVIRONMENT = _env_raw or ("production" if _legacy_is_production else "development")
IS_PRODUCTION = ENVIRONMENT == "production"

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "").strip()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()

FRONTEND_URL = os.getenv("FRONTEND_URL", "").strip()

UPLOAD_RATE_LIMIT_PER_MIN = int(os.getenv("UPLOAD_RATE_LIMIT_PER_MIN", "12"))
SCANS_RATE_LIMIT_PER_MIN = int(os.getenv("SCANS_RATE_LIMIT_PER_MIN", "120"))
SCANS_DELETE_RATE_LIMIT_PER_MIN = int(os.getenv("SCANS_DELETE_RATE_LIMIT_PER_MIN", "60"))
AUTH_RATE_LIMIT_PER_MIN = int(os.getenv("AUTH_RATE_LIMIT_PER_MIN", "180"))
CHAT_RATE_LIMIT_PER_MIN = int(os.getenv("CHAT_RATE_LIMIT_PER_MIN", "45"))
SUPPORT_RATE_LIMIT_PER_MIN = int(os.getenv("SUPPORT_RATE_LIMIT_PER_MIN", "20"))

TRUSTED_PROXY_DEPTH = int(os.getenv("TRUSTED_PROXY_DEPTH", "1"))

SUPPORT_EMAIL = os.getenv("SUPPORT_EMAIL", "").strip()
SMTP_HOST = os.getenv("SMTP_SERVER", os.getenv("SMTP_HOST", "")).strip()
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", SUPPORT_EMAIL).strip()
SMTP_PASSWORD = os.getenv("SUPPORT_EMAIL_PASSWORD", os.getenv("SMTP_PASSWORD", "")).strip()

# These MUST be set — backend refuses to start without them
HARD_REQUIRED_KEYS = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "FRONTEND_URL",
]

# These are needed for AI features — backend starts but AI degrades gracefully
AI_REQUIRED_KEYS = [
    "GEMINI_API_KEY",
    "GROQ_API_KEY",
    "OPENROUTER_API_KEY",
    "DEEPSEEK_API_KEY",
]


def validate_required_keys() -> List[str]:
    """Return list of HARD required keys that are missing (blocks startup)."""
    return [key for key in HARD_REQUIRED_KEYS if os.getenv(key, "").strip() == ""]


def validate_ai_keys() -> List[str]:
    """Return list of AI keys that are missing (warns but does not block startup)."""
    return [key for key in AI_REQUIRED_KEYS if os.getenv(key, "").strip() == ""]


def validate_frontend_url() -> None:
    parsed = urlparse(FRONTEND_URL)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("FRONTEND_URL must be an absolute URL")
    if "*" in FRONTEND_URL:
        raise ValueError("FRONTEND_URL cannot contain wildcards")
    if IS_PRODUCTION and parsed.scheme != "https":
        raise ValueError("FRONTEND_URL must use https in production")


def is_support_email_enabled() -> bool:
    return bool(SUPPORT_EMAIL and SMTP_HOST and SMTP_USER and SMTP_PASSWORD)