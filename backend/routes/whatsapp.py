"""
SwasthAI — /whatsapp/webhook Endpoint
Receives incoming WhatsApp messages from the bot server and routes them through the pipeline.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.models.request import AnalyzeRequest, WhatsAppWebhookRequest
from backend.models.response import AnalyzeResponse
from backend.services.pipeline import run_pipeline
from backend.services.session_manager import get_or_create_whatsapp_session

router = APIRouter()


@router.post("/whatsapp/webhook", response_model=AnalyzeResponse)
async def whatsapp_webhook(request: WhatsAppWebhookRequest):
    """
    Receives messages from the WhatsApp bot server (Node.js Baileys),
    converts them to AnalyzeRequest format, and runs the pipeline.
    """
    try:
        session_id = await get_or_create_whatsapp_session(request.phone_number)

        analyze_request = AnalyzeRequest(
            text=request.content if request.message_type in {"text", "image"} else None,
            voice_text=request.content if request.message_type == "voice" else None,
            language=request.language or "auto",
            location=request.location,
            session_id=session_id,
            channel="whatsapp",
        )

        return await run_pipeline(analyze_request)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"WhatsApp webhook error: {str(e)}")
