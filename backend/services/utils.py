"""
Shared utilities for Vaurex backend to avoid code duplication.
"""

import re
import hashlib
from typing import Optional


def sanitize_user_message(message: str, max_length: int = 2000) -> str:
    cleaned = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F]", "", message).strip()
    return cleaned[:max_length]


def hash_ip_for_privacy(ip: str) -> str:
    """Hash IP address for privacy in rate limiting."""
    return hashlib.sha256(ip.encode()).hexdigest()[:16]


def sniff_file_type(content: bytes) -> Optional[str]:
    """Detect file type from binary content."""
    if content.startswith(b"%PDF-"):
        return "application/pdf"
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if content.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if content.startswith((b"GIF87a", b"GIF89a")):
        return "image/gif"
    if content.startswith(b"RIFF") and len(content) > 12 and content[8:12] == b"WEBP":
        return "image/webp"
    if content.startswith(b"BM"):
        return "image/bmp"
    if content.startswith((b"II*\x00", b"MM\x00*")):
        return "image/tiff"
    return None


def is_mime_extension_compatible(ext: str, mime: str) -> bool:
    """Check if file extension matches MIME type."""
    if ext == ".pdf":
        return mime == "application/pdf"
    if ext in {".jpg", ".jpeg"}:
        return mime in {"image/jpeg", "image/jpg"}
    if ext == ".png":
        return mime == "image/png"
    if ext == ".gif":
        return mime == "image/gif"
    if ext == ".webp":
        return mime == "image/webp"
    if ext == ".bmp":
        return mime == "image/bmp"
    if ext in {".tif", ".tiff"}:
        return mime == "image/tiff"
    return False


# File type constants
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
}


def extract_json_object(text: str) -> Optional[dict]:
    """Parse JSON even when wrapped in markdown/code fences."""
    if not text:
        return None

    candidate = text.strip()
    if candidate.startswith("```"):
        candidate = re.sub(r"^```[a-zA-Z]*\n", "", candidate)
        candidate = candidate.rstrip("`").strip()

    try:
        import json
        return json.loads(candidate)
    except json.JSONDecodeError:
        pass

    start = candidate.find("{")
    end = candidate.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            import json
            return json.loads(candidate[start : end + 1])
        except json.JSONDecodeError:
            return None
    return None
