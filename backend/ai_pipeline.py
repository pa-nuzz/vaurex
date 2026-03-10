"""
Vaurex AI Document Analysis Pipeline
  1. Text extraction: pypdf (text PDFs) → Gemini 2.0-flash Vision (OCR) → Groq Vision fallback
  2. NLP analysis:    Groq Llama-3.3-70b → OpenRouter DeepSeek-V3 fallback
"""

import io
import os
import json
import base64
import asyncio
import logging
import time
import re
from typing import Optional

from groq import Groq
import httpx
from pypdf import PdfReader
from PIL import Image, ImageEnhance, ImageFilter

logging.getLogger("pypdf").setLevel(logging.ERROR)
logger = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
OPENROUTER_KEY = os.environ.get("OPENROUTER_API_KEY", "")
groq_client = Groq(api_key=GROQ_API_KEY)

TEXT_MIN_LENGTH = 10  # Minimum chars to consider extraction successful


def _extract_json_object(text: str) -> Optional[dict]:
    """Parse JSON even when wrapped in markdown/code fences."""
    if not text:
        return None

    candidate = text.strip()
    if candidate.startswith("```"):
        candidate = re.sub(r"^```[a-zA-Z]*\n", "", candidate)
        candidate = candidate.rstrip("`").strip()

    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        pass

    start = candidate.find("{")
    end = candidate.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(candidate[start : end + 1])
        except json.JSONDecodeError:
            return None
    return None


# ── Image Preprocessing ───────────────────────────────────────────────────────
def _preprocess_image(data: bytes) -> bytes:
    """Resize, sharpen, and boost contrast for better OCR."""
    img = Image.open(io.BytesIO(data))
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    max_dim = 2048
    if max(img.size) > max_dim:
        ratio = max_dim / max(img.size)
        img = img.resize(
            (int(img.width * ratio), int(img.height * ratio)),
            Image.Resampling.LANCZOS,
        )
    img = ImageEnhance.Contrast(img).enhance(1.4)
    img = ImageEnhance.Sharpness(img).enhance(1.6)
    img = img.filter(ImageFilter.DETAIL)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# ── Text Extraction ───────────────────────────────────────────────────────────
def _extract_pdf_text(data: bytes) -> str:
    """Extract text from a text-based PDF using tolerant parsing."""
    try:
        reader = PdfReader(io.BytesIO(data), strict=False)
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n\n".join(pages).strip()
    except Exception:
        return ""


async def _gemini_vision_extract(data: bytes, mime: str) -> str:
    """Use Gemini API directly for OCR."""
    if not GEMINI_API_KEY:
        return ""

    models = ["gemini-2.0-flash", "gemini-1.5-flash"]
    out_mime = "application/pdf" if mime == "application/pdf" else "image/png"
    b64 = base64.b64encode(data).decode()

    for model in models:
        try:
            url = (
                f"https://generativelanguage.googleapis.com/v1beta/models"
                f"/{model}:generateContent?key={GEMINI_API_KEY}"
            )
            payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": (
                                    "Extract ALL text from this document. "
                                    "Return only the raw extracted text with no commentary."
                                )
                            },
                            {
                                "inline_data": {
                                    "mime_type": out_mime,
                                    "data": b64,
                                }
                            },
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0,
                },
            }

            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(url, json=payload)
                resp.raise_for_status()
                body = resp.json()

            candidates = body.get("candidates", [])
            if not candidates:
                continue

            parts = candidates[0].get("content", {}).get("parts", [])
            text = "\n".join(part.get("text", "") for part in parts).strip()
            if len(text) >= TEXT_MIN_LENGTH:
                return text
        except Exception:
            continue
    return ""


async def _groq_vision_extract(data: bytes) -> str:
    """Fallback OCR using Groq llama-3.2-11b-vision-preview."""
    if not GROQ_API_KEY:
        return ""
    try:
        processed = _preprocess_image(data)
        b64 = base64.b64encode(processed).decode()
        response = await asyncio.to_thread(
            groq_client.chat.completions.create,
            model="llama-3.2-11b-vision-preview",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": "Extract ALL text from this image. Return only the raw extracted text."},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}},
                ],
            }],
            max_tokens=4096,
        )
        content = response.choices[0].message.content or ""
        return content.strip()
    except Exception:
        return ""


async def _extract_text(
    data: bytes, filename: str, content_type: str, scan_id: Optional[str] = None
) -> str:
    """Multi-strategy text extraction with structured logging."""
    is_pdf = content_type == "application/pdf" or filename.lower().endswith(".pdf")

    # Strategy 1: pypdf for text-based PDFs
    if is_pdf:
        text = _extract_pdf_text(data)
        if len(text) >= TEXT_MIN_LENGTH:
            logger.info(
                "scan.extraction.strategy",
                extra={"scan_id": scan_id, "strategy": "pypdf", "text_length": len(text)},
            )
            return text
        logger.warning(
            "scan.extraction.fallback",
            extra={"scan_id": scan_id, "from": "pypdf", "reason": "text too short"},
        )

    # Strategy 2: Gemini Vision
    mime = content_type if is_pdf else "image/png"
    text = await _gemini_vision_extract(data, mime)
    if len(text) >= TEXT_MIN_LENGTH:
        logger.info(
            "scan.extraction.strategy",
            extra={"scan_id": scan_id, "strategy": "gemini_vision", "text_length": len(text)},
        )
        return text
    logger.warning(
        "scan.extraction.fallback",
        extra={"scan_id": scan_id, "from": "gemini_vision", "reason": "text too short or error"},
    )

    # Strategy 3: Groq Vision fallback
    text = await _groq_vision_extract(data)
    if len(text) >= TEXT_MIN_LENGTH:
        logger.info(
            "scan.extraction.strategy",
            extra={"scan_id": scan_id, "strategy": "groq_vision", "text_length": len(text)},
        )
        return text

    logger.error(
        "scan.extraction.failed",
        extra={"scan_id": scan_id, "reason": "all strategies exhausted"},
    )
    return ""


# ── NLP Analysis ──────────────────────────────────────────────────────────────
_ANALYSIS_SYSTEM = """You are a forensic document intelligence analyst. Analyze the provided document text and produce a structured JSON report.

## Risk Scoring Rubric (0-100):
- **0-15 (Benign)**: Standard business documents, routine correspondence, public information
- **16-35 (Low)**: Minor irregularities, informal language in formal contexts, minor data inconsistencies
- **36-55 (Medium)**: Significant anomalies, pressure tactics, unusual financial patterns, missing required disclosures
- **56-75 (High)**: Strong fraud indicators, impersonation attempts, forged elements, significant financial red flags
- **76-100 (Critical)**: Clear evidence of fraud, illegal activity, identity theft, money laundering, or imminent harm

## Requirements:
1. Score MUST be based on specific evidence found in the document — cite exact phrases/patterns
2. Extract ALL entities: people, organizations, dates, monetary amounts, addresses, phone numbers, emails
3. Provide a concise executive summary (2-3 sentences) of what this document is and its key implications
4. List specific risk flags with evidence from the text

## Output Format (strict JSON):
{
  "risk_score": <integer 0-100>,
  "risk_label": "<Benign|Low|Medium|High|Critical>",
  "summary": "<executive summary>",
  "entities": [{"type": "<Person|Org|Date|Money|Address|Phone|Email|Other>", "value": "<extracted value>", "context": "<surrounding context>"}],
  "flags": ["<specific risk flag with evidence>"]
}

Respond ONLY with valid JSON. No markdown, no explanation."""


async def _analyze_with_groq(text: str, scan_id: Optional[str] = None) -> Optional[dict]:
    """Primary NLP analysis using Groq Llama-3.3-70b."""
    if not GROQ_API_KEY:
        return None
    try:
        start = time.monotonic()
        response = await asyncio.to_thread(
            groq_client.chat.completions.create,
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": _ANALYSIS_SYSTEM},
                {"role": "user", "content": f"Analyze this document:\n\n{text[:12000]}"},
            ],
            temperature=0.1,
            max_tokens=4096,
            response_format={"type": "json_object"},
        )
        duration_ms = round((time.monotonic() - start) * 1000)
        content = response.choices[0].message.content
        result = _extract_json_object(content or "")
        if result:
            logger.info(
                "scan.analysis.model",
                extra={"scan_id": scan_id, "model": "groq/llama-3.3-70b-versatile", "duration_ms": duration_ms},
            )
        return result
    except Exception as e:
        logger.warning(
            "scan.analysis.model_error",
            extra={"scan_id": scan_id, "model": "groq/llama-3.3-70b-versatile", "error": str(e)},
        )
        return None


async def _analyze_with_openrouter(text: str, scan_id: Optional[str] = None) -> Optional[dict]:
    """Fallback NLP analysis using OpenRouter DeepSeek-V3."""
    if not OPENROUTER_KEY:
        return None
    try:
        start = time.monotonic()
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "deepseek/deepseek-chat-v3-0324",
                    "messages": [
                        {"role": "system", "content": _ANALYSIS_SYSTEM},
                        {"role": "user", "content": f"Analyze this document:\n\n{text[:12000]}"},
                    ],
                    "temperature": 0.1,
                    "max_tokens": 4096,
                },
            )
            resp.raise_for_status()
            data = resp.json()
        duration_ms = round((time.monotonic() - start) * 1000)
        content = data["choices"][0]["message"].get("content", "")
        result = _extract_json_object(content)
        if result:
            logger.info(
                "scan.analysis.model",
                extra={"scan_id": scan_id, "model": "openrouter/deepseek-v3", "duration_ms": duration_ms},
            )
        return result
    except Exception as e:
        logger.warning(
            "scan.analysis.model_error",
            extra={"scan_id": scan_id, "model": "openrouter/deepseek-v3", "error": str(e)},
        )
        return None


# ── Main Pipeline ─────────────────────────────────────────────────────────────
async def analyze_document(
    data: bytes,
    filename: str,
    content_type: str,
    scan_id: Optional[str] = None,
) -> dict:
    """Full document analysis pipeline: extract text → NLP analysis."""
    # Step 1: Extract text
    raw_text = await _extract_text(data, filename, content_type, scan_id=scan_id)
    if len(raw_text) < TEXT_MIN_LENGTH:
        raise ValueError(
            "Could not extract meaningful text from the document. "
            "Please ensure the file contains readable text or a clear image."
        )

    # Step 2: NLP Analysis — try Groq first, fall back to OpenRouter
    result = await _analyze_with_groq(raw_text, scan_id=scan_id)
    if not result:
        logger.warning(
            "scan.analysis.fallback",
            extra={"scan_id": scan_id, "from": "groq", "to": "openrouter"},
        )
        result = await _analyze_with_openrouter(raw_text, scan_id=scan_id)

    if not result:
        raise ValueError("AI analysis failed across all models. Please try again.")

    # Ensure required fields with correct types
    result.setdefault("risk_score", 0)
    result.setdefault("risk_label", "Unknown")
    result.setdefault("summary", "")
    result.setdefault("entities", [])
    result.setdefault("flags", [])

    if not isinstance(result["risk_score"], int):
        try:
            result["risk_score"] = int(result["risk_score"])
        except Exception:
            result["risk_score"] = 0

    result["risk_score"] = max(0, min(100, result["risk_score"]))

    if not isinstance(result["entities"], list):
        result["entities"] = []
    if not isinstance(result["flags"], list):
        result["flags"] = []

    result["raw_text"] = raw_text
    result["clean_text"] = raw_text.strip()

    return result
