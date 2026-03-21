"""
SwasthAI — Response Builder
Assembles the final AnalyzeResponse from all pipeline outputs.
"""

from models.response import AnalyzeResponse, PatientReport, HospitalInfo
from typing import List, Optional
from datetime import datetime


async def build_response(
    triage: str,
    reason: str,
    confidence: float,
    symptoms: List[str],
    remedies: List[str],
    audio_url: Optional[str],
    hospitals: List[dict],
    is_emergency: bool,
    translated_response: Optional[str] = None,
) -> AnalyzeResponse:
    """Assemble all pipeline outputs into the final response."""

    # Build hospital info objects
    hospital_list = [
        HospitalInfo(
            name=h.get("name", "Unknown"),
            lat=h.get("lat", 0.0),
            lng=h.get("lng", 0.0),
            distance=h.get("distance", "N/A"),
            contact=h.get("contact"),
            type=h.get("type"),
        )
        for h in hospitals
    ]

    # Build patient report
    advice = translated_response or reason
    if remedies:
        advice += " | Remedies: " + ", ".join(remedies)

    report = PatientReport(
        symptoms=symptoms,
        triage=triage,
        advice=advice,
        timestamp=datetime.utcnow().isoformat() + "Z",
    )

    return AnalyzeResponse(
        triage=triage,
        reason=reason,
        confidence=confidence,
        remedies=remedies,
        audio_url=audio_url,
        hospitals=hospital_list,
        report=report,
        is_emergency=is_emergency,
        translated_response=translated_response,
    )
