"""Single-path pipeline for the backend MVP."""

from __future__ import annotations

from backend.ai.disease_predictor import predict_disease
from backend.ai.emergency import check_emergency_from_text
from backend.ai.symptom_extractor_dataset import extract_symptoms_from_text
from backend.ai.triage import run_triage
from backend.models.request import AnalyzeRequest
from backend.models.response import AnalyzeResponse
from backend.services.database import save_triage_result
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

    pass

    triage_result = await run_triage(normalized_text)
    symptoms_dict, _ = extract_symptoms_from_text(normalized_text)
    disease = predict_disease(symptoms_dict)

    localized_reason = await translate_from_english(triage_result["reason"], detected_language)
    localized_actions = await translate_text_list(triage_result["recommended_actions"], detected_language)
    localized_disclaimer = await translate_from_english(DEFAULT_DISCLAIMER, detected_language)
    facilities = []
    if request.location and triage_result["triage"] in {"clinic", "emergency"}:
        facilities = await find_nearest_facilities(
            request.location.lat,
            request.location.lng,
            triage_level=triage_result["triage"],
            symptom_text=normalized_text,
            limit=3,
        )
        if facilities:
            localized_match_reasons = await translate_text_list(
                [facility["match_reason"] for facility in facilities],
                detected_language,
            )
            for facility, localized_reason in zip(facilities, localized_match_reasons):
                facility["match_reason"] = localized_reason

    response = AnalyzeResponse(
        session_id=request.session_id,
        language=detected_language,
        disease=disease,
        triage=triage_result["triage"],
        reason=localized_reason,
        confidence=triage_result["confidence"],
        triage_engine=triage_result.get("triage_engine", "fallback"),
        recommended_actions=localized_actions,
        needs_more_info=bool(triage_result.get("needs_more_info", False)),
        follow_up_questions=await translate_text_list(triage_result.get("follow_up_questions", []), detected_language),
        facilities=facilities,
        is_emergency=triage_result["triage"] == "emergency",
        disclaimer=localized_disclaimer,
    )
    await add_message(request.session_id, "assistant", response.reason)
    await save_triage_result(
        session_id=request.session_id,
        triage_level=response.triage,
        confidence=response.confidence,
        reason=response.reason,
    )
    return response
