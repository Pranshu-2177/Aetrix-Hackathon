"""
SwasthAI — /whatsapp/webhook Endpoint
Receives incoming WhatsApp messages from the bot server and routes them through the pipeline.
"""

from fastapi import APIRouter, HTTPException
from models.request import WhatsAppWebhookRequest, AnalyzeRequest
from models.response import AnalyzeResponse
from services.pipeline import run_pipeline
from services.session_manager import get_or_create_whatsapp_session

router = APIRouter()


@router.post("/whatsapp/webhook", response_model=AnalyzeResponse)
async def whatsapp_webhook(request: WhatsAppWebhookRequest):
    """
    Receives messages from the WhatsApp bot server (Node.js Baileys),
    converts them to AnalyzeRequest format, and runs the pipeline.
    """
    try:
        # Get or create a session for this WhatsApp phone number
        session_id = await get_or_create_whatsapp_session(request.phone_number)

        # Map WhatsApp message to AnalyzeRequest format
        analyze_request = AnalyzeRequest(
            text=request.content if request.message_type == "text" else None,
            voice_text=request.content if request.message_type == "voice" else None,
            image=request.content if request.message_type == "image" else None,
            language=request.language or "en",
            location=request.location,
            session_id=session_id,
            channel="whatsapp"
        )

        result = await run_pipeline(analyze_request)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"WhatsApp webhook error: {str(e)}")
