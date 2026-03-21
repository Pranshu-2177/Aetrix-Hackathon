"""Single-path pipeline for the backend MVP."""

from __future__ import annotations

from backend.ai.emergency import check_emergency_from_text
from backend.ai.triage import run_triage
from backend.models.request import AnalyzeRequest
from backend.models.response import AnalyzeResponse
from backend.services.session_manager import add_message, get_or_create_session

EMERGENCY_ACTIONS = [
    "Call 108 or go to the nearest emergency department now.",
    "Do not rely on home remedies for these symptoms.",
    "If possible, have someone stay with you while you seek help.",
]


async def run_pipeline(request: AnalyzeRequest) -> AnalyzeResponse:
    """Process a text symptom description and return a triage result."""
    await get_or_create_session(
        session_id=request.session_id,
        channel=request.channel,
        language=request.language,
    )
    await add_message(request.session_id, "user", request.text)

    emergency_result = check_emergency_from_text(request.text)
    if emergency_result["is_emergency"]:
        response = AnalyzeResponse(
            session_id=request.session_id,
            triage="emergency",
            reason=str(emergency_result["reason"]),
            confidence=0.99,
            recommended_actions=EMERGENCY_ACTIONS,
            is_emergency=True,
        )
        await add_message(request.session_id, "assistant", response.reason)
        return response

    triage_result = await run_triage(request.text)
    response = AnalyzeResponse(
        session_id=request.session_id,
        triage=triage_result["triage"],
        reason=triage_result["reason"],
        confidence=triage_result["confidence"],
        recommended_actions=triage_result["recommended_actions"],
        is_emergency=triage_result["triage"] == "emergency",
    )
    await add_message(request.session_id, "assistant", response.reason)
    return response
