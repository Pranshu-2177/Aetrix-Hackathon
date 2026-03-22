"""Pydantic models for API responses."""

from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class FacilityInfo(BaseModel):
    name: str = Field(..., description="Facility name")
    facility_type: Literal["phc", "chc", "hospital"] = Field(..., description="Type of care centre")
    lat: float = Field(..., description="Latitude")
    lng: float = Field(..., description="Longitude")
    distance_km: float = Field(..., description="Distance from the user in kilometers")
    distance_text: str = Field(..., description="Human-readable distance string")
    rating: float = Field(..., ge=0.0, le=5.0, description="Facility star rating")
    review_count: int = Field(default=0, ge=0, description="Approximate number of ratings")
    match_reason: str = Field(..., description="Short reason why this facility fits the case")
    formatted_address: Optional[str] = Field(default=None, description="Readable address if available")
    maps_uri: Optional[str] = Field(default=None, description="Direct Google Maps link if available")
    contact: Optional[str] = Field(default=None, description="Phone number if available")
    recommended_for: List[Literal["clinic", "emergency"]] = Field(
        default_factory=list,
        description="Which triage levels this facility is appropriate for.",
    )


class AnalyzeResponse(BaseModel):
    session_id: str = Field(..., description="Server-side session identifier")
    language: str = Field(..., description="Detected or selected response language")
    disease: Optional[str] = Field(default=None, description="Predicted disease from symptom matching.")
    triage: Literal["self-care", "clinic", "emergency"] = Field(
        ...,
        description="Urgency classification for the reported symptoms.",
    )
    reason: str = Field(..., description="Plain-language explanation of the triage result.")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score between 0 and 1.")
    triage_engine: Literal["groq", "fallback"] = Field(
        default="fallback",
        description="Shows whether the response came from Groq or the local fallback rules.",
    )
    recommended_actions: List[str] = Field(
        default_factory=list,
        description="Immediate next steps the user should take.",
    )
    needs_more_info: bool = Field(
        default=False,
        description="True when more symptom details are needed before guidance.",
    )
    follow_up_questions: List[str] = Field(
        default_factory=list,
        description="Short follow-up questions when the message is too vague.",
    )
    facilities: List[FacilityInfo] = Field(
        default_factory=list,
        description="Nearest appropriate PHCs or hospitals based on triage level.",
    )
    is_emergency: bool = Field(default=False, description="True when emergency escalation is required.")
    disclaimer: str = Field(
        default="This gives quick guidance only. It is not a doctor's final advice. If you feel worse or feel unsafe, go to a doctor or hospital.",
        description="Safety disclaimer shown with every response.",
    )
