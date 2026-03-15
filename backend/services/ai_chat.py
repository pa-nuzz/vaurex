"""
Shared AI chat utilities to avoid duplication across routes.
"""

import asyncio
import logging
from typing import Optional, List, Tuple

logger = logging.getLogger(__name__)


async def chat_with_groq(messages: List[dict], groq_client, model: str = "llama-3.3-70b-versatile") -> Optional[Tuple[str, str]]:
    """Chat with Groq AI provider."""
    if not groq_client:
        return None
    try:
        completion = await asyncio.to_thread(
            groq_client.chat.completions.create,
            model=model,
            messages=messages,
            temperature=0.2,
            max_tokens=1600,
        )
        answer = (completion.choices[0].message.content or "").strip()
        if answer:
            return answer, f"groq/{model}"
    except Exception as exc:
        logger.warning("chat.provider.groq_error", extra={"error": str(exc)})
    return None


async def chat_with_openrouter(messages: List[dict], api_key: str, model: str = "deepseek/deepseek-chat-v3-0324") -> Optional[Tuple[str, str]]:
    """Chat with OpenRouter AI provider."""
    if not api_key:
        return None
    try:
        import httpx
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": 0.2,
                    "max_tokens": 1600,
                },
            )
            response.raise_for_status()
            data = response.json()
        answer = (data["choices"][0]["message"].get("content") or "").strip()
        if answer:
            return answer, "openrouter/deepseek-v3"
    except Exception as exc:
        logger.warning("chat.provider.openrouter_error", extra={"error": str(exc)})
    return None


async def chat_with_deepseek(messages: List[dict], api_key: str, model: str = "deepseek-chat") -> Optional[Tuple[str, str]]:
    """Chat with DeepSeek AI provider."""
    if not api_key:
        return None
    try:
        import httpx
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": 0.2,
                    "max_tokens": 1600,
                },
            )
            response.raise_for_status()
            data = response.json()
        answer = (data["choices"][0]["message"].get("content") or "").strip()
        if answer:
            return answer, f"deepseek/{model}"
    except Exception as exc:
        logger.warning("chat.provider.deepseek_error", extra={"error": str(exc)})
    return None


async def chat_with_gemini(messages: List[dict], api_key: str, model: str = "gemini-2.0-flash") -> Optional[Tuple[str, str]]:
    """Chat with Gemini AI provider."""
    if not api_key:
        return None
    try:
        import httpx
        # Convert messages to Gemini format
        content = ""
        for msg in messages:
            if msg["role"] == "system":
                content += f"System: {msg['content']}\n\n"
            elif msg["role"] == "user":
                content += f"User: {msg['content']}\n\n"
            elif msg["role"] == "assistant":
                content += f"Assistant: {msg['content']}\n\n"
        
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [
                        {"role": "user", "parts": [{"text": content.strip()}]}
                    ],
                    "generationConfig": {"temperature": 0.2, "maxOutputTokens": 1600},
                },
            )
            response.raise_for_status()
            data = response.json()
        answer = (
            data.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "")
        ).strip()
        if answer:
            return answer, f"gemini/{model}"
    except Exception as exc:
        logger.warning("chat.provider.gemini_error", extra={"error": str(exc)})
    return None


async def get_ai_response(
    messages: List[dict],
    groq_client=None,
    openrouter_key: str = "",
    deepseek_key: str = "",
    gemini_key: str = "",
    include_gemini: bool = False
) -> Tuple[str, str]:
    """
    Get AI response using fallback chain: Groq → OpenRouter → DeepSeek → Gemini.
    
    Returns:
        Tuple of (response_text, model_used)
    """
    # Try Groq first
    if groq_client:
        result = await chat_with_groq(messages, groq_client)
        if result:
            return result
    
    # Try OpenRouter
    if openrouter_key:
        result = await chat_with_openrouter(messages, openrouter_key)
        if result:
            return result
    
    # Try DeepSeek
    if deepseek_key:
        result = await chat_with_deepseek(messages, deepseek_key)
        if result:
            return result
    
    # Try Gemini (optional, usually last)
    if include_gemini and gemini_key:
        result = await chat_with_gemini(messages, gemini_key)
        if result:
            return result
    
    raise Exception("All AI providers failed")
