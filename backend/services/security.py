import asyncio
import os
import re
import time
import uuid
import logging
from collections import defaultdict
from contextlib import asynccontextmanager
from typing import Any, Optional

from fastapi import HTTPException, Request

from services.audit import audit_event

logger = logging.getLogger(__name__)

MAX_MESSAGE_LENGTH = 2000
MAX_NAME_LENGTH = 200
MAX_DESCRIPTION_LENGTH = 1000
MAX_FILENAME_LENGTH = 200
MAX_UPLOAD_BYTES = 20 * 1024 * 1024
UPLOAD_CHUNK_SIZE = 1024 * 1024

_FILENAME_SAFE_CHARS = re.compile(r"[^A-Za-z0-9._ -]+")
_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]")
_SYSTEM_LEAK_MARKERS = (
    "system prompt",
    "developer message",
    "internal instruction",
    "hidden prompt",
    "chain of thought",
)


def sanitize_text_input(value: Optional[str], max_length: int, field_name: str) -> str:
    text = _CONTROL_CHARS.sub("", (value or "").strip())
    if not text:
        raise HTTPException(status_code=400, detail=f"{field_name} is required")
    if len(text) > max_length:
        raise HTTPException(status_code=400, detail=f"{field_name} is too long")
    return text


def sanitize_optional_text_input(value: Optional[str], max_length: int, field_name: str) -> Optional[str]:
    if value is None:
        return None
    text = _CONTROL_CHARS.sub("", value.strip())
    if not text:
        return None
    if len(text) > max_length:
        raise HTTPException(status_code=400, detail=f"{field_name} is too long")
    return text


def sanitize_ai_output(value: Optional[str], max_length: int = 8000) -> str:
    text = _CONTROL_CHARS.sub("", (value or "").strip())
    if not text:
        return ""

    filtered_lines: list[str] = []
    for line in text.splitlines():
        lowered = line.strip().lower()
        if any(marker in lowered for marker in _SYSTEM_LEAK_MARKERS):
            continue
        if lowered.startswith("system:") or lowered.startswith("developer:"):
            continue
        filtered_lines.append(line)

    sanitized = "\n".join(filtered_lines).strip()
    return sanitized[:max_length]


def sanitize_filename(filename: str) -> str:
    raw = (filename or "").strip()
    if not raw:
        raise HTTPException(status_code=400, detail="Filename is required")
    if "../" in raw or "..\\" in raw:
        raise HTTPException(status_code=400, detail="Invalid filename")

    name = os.path.basename(raw)
    name = _CONTROL_CHARS.sub("", name)
    name = _FILENAME_SAFE_CHARS.sub("_", name)
    name = re.sub(r"\s+", " ", name).strip(" ._")
    if not name:
        raise HTTPException(status_code=400, detail="Invalid filename")
    if len(name) > MAX_FILENAME_LENGTH:
        root, ext = os.path.splitext(name)
        keep = max(1, MAX_FILENAME_LENGTH - len(ext))
        name = f"{root[:keep]}{ext}"
    return name


def build_storage_filename(display_name: str) -> str:
    extension = os.path.splitext(display_name)[1].lower()
    return f"{uuid.uuid4()}{extension}"


def request_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for", "")
    if forwarded_for:
        return forwarded_for.split(",", 1)[0].strip()
    return request.client.host if request.client else "unknown"


def request_fingerprint(request: Request) -> str:
    ip = request_ip(request)
    user_agent = (request.headers.get("user-agent") or "unknown")[:256]
    seed = f"{ip}|{user_agent}"
    import hashlib

    return hashlib.sha256(seed.encode("utf-8")).hexdigest()


async def read_validated_upload(file: Any, allowed_extensions: set[str], allowed_mime_types: set[str]) -> tuple[bytes, str, str, str, int]:
    from services.utils import is_mime_extension_compatible, sniff_file_type

    display_name = sanitize_filename(file.filename or "")
    extension = os.path.splitext(display_name)[1].lower()
    if extension not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    declared_type = (file.content_type or "application/octet-stream").split(";", 1)[0].strip().lower()
    content_length = file.headers.get("content-length") if getattr(file, "headers", None) else None
    if content_length:
        try:
            if int(content_length) > MAX_UPLOAD_BYTES:
                raise HTTPException(status_code=400, detail="File too large (max 20 MB)")
        except ValueError:
            pass

    total_bytes = 0
    content = bytearray()
    magic = bytearray()

    while True:
        chunk = await file.read(UPLOAD_CHUNK_SIZE)
        if not chunk:
            break
        total_bytes += len(chunk)
        if total_bytes > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=400, detail="File too large (max 20 MB)")
        if len(magic) < 16:
            missing = 16 - len(magic)
            magic.extend(chunk[:missing])
        content.extend(chunk)

    if total_bytes == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    sniffed_type = sniff_file_type(bytes(magic))
    if not sniffed_type or sniffed_type not in allowed_mime_types:
        raise HTTPException(status_code=400, detail="Unsupported or invalid file payload")
    if not is_mime_extension_compatible(extension, sniffed_type):
        raise HTTPException(status_code=400, detail="File extension does not match file content")
    if declared_type not in {"application/octet-stream", sniffed_type}:
        raise HTTPException(status_code=400, detail="Declared content type does not match file content")

    storage_name = build_storage_filename(display_name)
    return bytes(content), sniffed_type, display_name, storage_name, total_bytes


async def verify_ownership(
    resource_id: str,
    user_id: str,
    table: str,
    supabase_client: Any,
    *,
    request: Optional[Request] = None,
    id_column: str = "id",
    owner_column: str = "user_id",
    select_fields: str = "*",
    extra_filters: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    query = supabase_client.table(table).select(select_fields).eq(id_column, resource_id)
    for key, value in (extra_filters or {}).items():
        query = query.eq(key, value)

    response = query.limit(1).execute()
    rows = response.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Resource not found")

    row = rows[0]
    if row.get(owner_column) != user_id:
        logger.warning(
            "security.ownership_denied",
            extra={"table": table, "resource_id": resource_id, "user_id": user_id},
        )
        if request is not None:
            audit_event(
                request,
                event="ownership.verify",
                outcome="denied",
                user_id=user_id,
                table=table,
                resource_id=resource_id,
            )
        # Return 404 (not 403) — never reveal whether a resource exists to an unauthorized user
        raise HTTPException(status_code=404, detail="Resource not found")

    return row


class UploadConcurrencyGate:
    def __init__(self, max_concurrent: int = 3):
        self._max_concurrent = max_concurrent
        self._counts: defaultdict[str, int] = defaultdict(int)
        self._lock = asyncio.Lock()

    @asynccontextmanager
    async def acquire(self, key: str):
        async with self._lock:
            if self._counts[key] >= self._max_concurrent:
                raise HTTPException(status_code=429, detail="Too many concurrent uploads")
            self._counts[key] += 1

        try:
            yield
        finally:
            async with self._lock:
                self._counts[key] = max(0, self._counts[key] - 1)
                if self._counts[key] == 0:
                    self._counts.pop(key, None)


GLOBAL_UPLOAD_GATE = UploadConcurrencyGate(max_concurrent=3)