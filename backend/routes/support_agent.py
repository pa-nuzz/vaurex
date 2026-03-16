import asyncio
import logging
from typing import Optional, List
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field
from services.rate_limiter import PERSISTENT_GUEST_RATE_LIMITER
from services.config import GROQ_API_KEY, OPENROUTER_API_KEY, DEEPSEEK_API_KEY
from services.ai_chat import get_ai_response
from services.security import MAX_MESSAGE_LENGTH, _CONTROL_CHARS, request_fingerprint, sanitize_ai_output, sanitize_text_input

router = APIRouter()
logger = logging.getLogger(__name__)

# Guest rate limit: 10 messages per IP per hour
GUEST_RATE_LIMIT = 10
GUEST_RATE_WINDOW = 3600  # 1 hour in seconds


# ── Request/Response Models ───────────────────────────────────────────────────
class SupportAgentRequest(BaseModel):
    message: str = Field(min_length=2, max_length=MAX_MESSAGE_LENGTH)
    conversation_history: Optional[List[dict]] = Field(default_factory=list, max_length=20)
    context_type: str = Field(default="general", pattern="^(general|product)$")


class SupportAgentResponse(BaseModel):
    message: str
    conversation_history: List[dict]


# ── Rate Limiting ────────────────────────────────────────────────────────────
async def _check_guest_agent_rate_limit(request: Request) -> None:
    """Check if guest has exceeded support agent chat limit."""
    key = f"guest_agent_chat:{request_fingerprint(request)}"
    allowed, retry_after, _, _ = await PERSISTENT_GUEST_RATE_LIMITER.allow(key, GUEST_RATE_LIMIT, GUEST_RATE_WINDOW)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail={
                "success": False,
                "error": "Rate limit exceeded. Please try again later.",
                "code": "RATE_LIMIT_EXCEEDED"
            },
            headers={"Retry-After": str(retry_after)}
        )



# ── Support Agent Chat ───────────────────────────────────────────────────────
@router.post("/agent/chat")
async def support_agent_chat(
    payload: SupportAgentRequest,
    request: Request
):
    """
    AI Customer Support Agent for Vaurex.
    Available to both authenticated and guest users.
    """
    
    # Check guest rate limit
    await _check_guest_agent_rate_limit(request)
    
    message = sanitize_text_input(payload.message, MAX_MESSAGE_LENGTH, "Message")
    
    # Build conversation history
    conversation_history = payload.conversation_history or []
    
    # System prompt for Vex, the Vaurex support assistant
    system_prompt = (
        "You are Vex, the friendly AI assistant for Vaurex Document Intelligence Platform. "
        "You help users understand how to use Vaurex, troubleshoot issues, and get the most "
        "out of document analysis features.\n\n"
        "You know everything about Vaurex:\n"
        "- It analyzes documents using Gemini OCR + AI analysis\n"
        "- It provides risk scoring (0-100), entity extraction, executive summaries\n"
        "- Features: Document Scanner, Knowledge Base, Compliance Monitor\n"
        "- Pricing: Free (3 docs/day) and Pro ($29/mo, unlimited)\n"
        "- Supported files: PDF, PNG, JPG, WEBP up to 20MB\n"
        "- Common issues: upload errors, slow processing, incorrect analysis\n\n"
        "You answer questions about:\n"
        "- How to use the platform\n"
        "- What the risk scores mean\n"
        "- How to interpret entity extraction\n"
        "- Troubleshooting upload issues\n"
        "- Pricing and features\n"
        "- How Knowledge Base and Compliance Monitor work\n\n"
        "If someone asks something you cannot answer, say you will connect them "
        "with the support team and ask them to use the contact form.\n\n"
        "Be friendly, concise, and helpful. Use simple language."
    )
    
    # Build messages for AI
    messages = [{"role": "system", "content": system_prompt}]
    
    # Add conversation history (keep last 10 exchanges)
    for msg in conversation_history[-10:]:
        if msg.get("role") in ["user", "assistant"]:
            content = _CONTROL_CHARS.sub("", str(msg.get("content", "")))[:MAX_MESSAGE_LENGTH]
            messages.append({
                "role": msg["role"],
                "content": content,
            })
    
    # Add current message
    messages.append({"role": "user", "content": message})
    
    # Try AI providers using shared function
    try:
        from groq import Groq
        groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
        
        answer, model = await get_ai_response(
            messages=messages,
            groq_client=groq_client,
            openrouter_key=OPENROUTER_API_KEY,
            deepseek_key=DEEPSEEK_API_KEY,
            include_gemini=False  # No Gemini for support agent
        )
    except Exception as e:
        logger.error("support_agent.all_providers_failed", extra={"error": str(e)})
        raise HTTPException(
            status_code=502,
            detail={
                "success": False,
                "error": "Support agent is temporarily unavailable",
                "code": "AGENT_UNAVAILABLE"
            }
        )
    
    # Update conversation history
    updated_history = conversation_history + [
        {"role": "user", "content": message},
        {"role": "assistant", "content": answer}
    ]
    
    # Log the interaction
    fingerprint = request_fingerprint(request)
    
    logger.info(
        "support_agent.chat.success",
        extra={
            "fingerprint": fingerprint,
            "context_type": payload.context_type,
            "model": model,
            "message_length": len(message),
            "response_length": len(answer)
        }
    )
    
    return {
        "success": True,
        "data": {
            "message": sanitize_ai_output(answer),
            "conversation_history": updated_history[-20:]  # Keep last 20 messages
        }
    }


# ── Health Check ───────────────────────────────────────────────────────────
@router.get("/agent/health")
async def agent_health():
    """Health check for support agent service."""
    return {
        "success": True,
        "data": {
            "status": "healthy",
            "service": "Vaurex Support Agent",
            "rate_limit": {
                "guest_limit": GUEST_RATE_LIMIT,
                "guest_window": GUEST_RATE_WINDOW
            }
        }
    }
