"""Single-path pipeline for the backend MVP."""

from __future__ import annotations

from backend.ai.emergency import check_emergency_from_text
from backend.ai.triage import run_triage
from backend.models.request import AnalyzeRequest
from backend.models.response import AnalyzeResponse
from backend.services.hospitals_service import find_nearest_facilities
from backend.services.session_manager import add_message, get_or_create_session
from backend.services.translator import detect_language, translate_from_english, translate_text_list, translate_to_english

EMERGENCY_ACTIONS = [
    "Call 108 or go to the nearest emergency department now.",
    "Do not rely on home remedies for these symptoms.",
    "If possible, have someone stay with you while you seek help.",
]
DEFAULT_DISCLAIMER = "This gives quick guidance only. It is not a doctor's final advice. If you feel worse or feel unsafe, go to a doctor or hospital."


async def run_pipeline(request: AnalyzeRequest) -> AnalyzeResponse:
    """Process text or voice-transcript symptoms and return a localized triage result."""
    raw_text = " ".join(part for part in [request.text, request.voice_text] if part)

    await get_or_create_session(
        session_id=request.session_id,
        channel=request.channel,
        language=request.language,
    )
    await add_message(request.session_id, "user", raw_text)

    detected_language = request.language if request.language != "auto" else await detect_language(raw_text)
    normalized_text = await translate_to_english(raw_text, detected_language)

    emergency_result = check_emergency_from_text(normalized_text)
    if emergency_result["is_emergency"]:
        localized_reason = await translate_from_english(str(emergency_result["reason"]), detected_language)
        localized_actions = await translate_text_list(EMERGENCY_ACTIONS, detected_language)
        localized_disclaimer = await translate_from_english(DEFAULT_DISCLAIMER, detected_language)
        facilities = []
        if request.location:
            facilities = await find_nearest_facilities(
                request.location.lat,
                request.location.lng,
                triage_level="emergency",
            )

        response = AnalyzeResponse(
            session_id=request.session_id,
            language=detected_language,
            triage="emergency",
            reason=localized_reason,
            confidence=0.99,
            recommended_actions=localized_actions,
            facilities=facilities,
            is_emergency=True,
            disclaimer=localized_disclaimer,
        )
        await add_message(request.session_id, "assistant", response.reason)
        return response

    triage_result = await run_triage(normalized_text)
    localized_reason = await translate_from_english(triage_result["reason"], detected_language)
    localized_actions = await translate_text_list(triage_result["recommended_actions"], detected_language)
    localized_disclaimer = await translate_from_english(DEFAULT_DISCLAIMER, detected_language)
    facilities = []
    if request.location and triage_result["triage"] in {"clinic", "emergency"}:
        facilities = await find_nearest_facilities(
            request.location.lat,
            request.location.lng,
            triage_level=triage_result["triage"],
        )

    response = AnalyzeResponse(
        session_id=request.session_id,
        language=detected_language,
        triage=triage_result["triage"],
        reason=localized_reason,
        confidence=triage_result["confidence"],
        recommended_actions=localized_actions,
        facilities=facilities,
        is_emergency=triage_result["triage"] == "emergency",
        disclaimer=localized_disclaimer,
    )
    await add_message(request.session_id, "assistant", response.reason)
    return response
