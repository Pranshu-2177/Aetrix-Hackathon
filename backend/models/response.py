"""Pydantic models for API responses."""

from __future__ import annotations

from typing import List, Literal

from pydantic import BaseModel, Field


class AnalyzeResponse(BaseModel):
    session_id: str = Field(..., description="Server-side session identifier")
    triage: Literal["self-care", "clinic", "emergency"] = Field(
        ...,
        description="Urgency classification for the reported symptoms.",
    )
    reason: str = Field(..., description="Plain-language explanation of the triage result.")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score between 0 and 1.")
    recommended_actions: List[str] = Field(
        default_factory=list,
        description="Immediate next steps the user should take.",
    )
    is_emergency: bool = Field(default=False, description="True when emergency escalation is required.")
    disclaimer: str = Field(
        default="This is AI-assisted triage, not a diagnosis. Seek professional care if symptoms worsen or you are unsure.",
        description="Safety disclaimer shown with every response.",
    )
