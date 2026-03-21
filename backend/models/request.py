"""Pydantic models for API request validation."""

from __future__ import annotations

import uuid
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator


class LocationData(BaseModel):
    lat: float = Field(..., description="Latitude")
    lng: float = Field(..., description="Longitude")


class AnalyzeRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=3,
        description="Free-form symptom description from the user.",
    )
    session_id: str = Field(
        default_factory=lambda: f"session-{uuid.uuid4().hex[:12]}",
        description="Server-generated session identifier when not provided.",
    )
    language: str = Field(
        default="en",
        description="ISO language code. MVP stores it as metadata only.",
    )
    channel: Literal["web", "mobile", "whatsapp", "api"] = Field(
        default="web",
        description="Source channel for the request.",
    )

    @field_validator("text")
    @classmethod
    def validate_text(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 3:
            raise ValueError("text must contain at least 3 non-space characters")
        return cleaned


class WhatsAppWebhookRequest(BaseModel):
    phone_number: str = Field(..., description="Sender's WhatsApp number")
    message_type: Literal["text", "voice", "image"] = Field(..., description="Inbound WhatsApp message type")
    content: str = Field(..., description="Message content or media payload reference")
    language: Optional[str] = Field(default="en", description="Detected or selected language")
    location: Optional[LocationData] = Field(default=None, description="Shared location if any")
