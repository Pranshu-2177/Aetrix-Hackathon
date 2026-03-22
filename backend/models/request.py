"""Pydantic models for API request validation."""

from __future__ import annotations

import uuid
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


class LocationData(BaseModel):
    lat: float = Field(..., description="Latitude")
    lng: float = Field(..., description="Longitude")


class AnalyzeRequest(BaseModel):
    text: Optional[str] = Field(
        default=None,
        description="Free-form symptom description from the user.",
    )
    voice_text: Optional[str] = Field(
        default=None,
        description="Speech-to-text transcript when symptoms arrive by voice.",
    )
    session_id: str = Field(
        default_factory=lambda: f"session-{uuid.uuid4().hex[:12]}",
        description="Server-generated session identifier when not provided.",
    )
    language: str = Field(
        default="auto",
        description="ISO language code or 'auto' for script-based detection.",
    )
    channel: Literal["web", "mobile", "whatsapp", "api"] = Field(
        default="web",
        description="Source channel for the request.",
    )
    location: Optional[LocationData] = Field(
        default=None,
        description="Optional user location for PHC / hospital recommendation.",
    )

    @field_validator("text")
    @classmethod
    def validate_text(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        cleaned = value.strip()
        if len(cleaned) < 1:
            raise ValueError("text must contain at least 1 non-space character")
        return cleaned

    @field_validator("voice_text")
    @classmethod
    def validate_voice_text(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        cleaned = value.strip()
        if len(cleaned) < 1:
            raise ValueError("voice_text must contain at least 1 non-space character")
        return cleaned

    @model_validator(mode="after")
    def validate_input_sources(self) -> "AnalyzeRequest":
        if not self.text and not self.voice_text:
            raise ValueError("At least one input is required: text or voice_text")
        return self


class WhatsAppWebhookRequest(BaseModel):
    phone_number: str = Field(..., description="Sender's WhatsApp number")
    message_type: Literal["text", "voice", "image"] = Field(..., description="Inbound WhatsApp message type")
    content: str = Field(..., description="Message content or media payload reference")
    language: Optional[str] = Field(default="en", description="Detected or selected language")
    location: Optional[LocationData] = Field(default=None, description="Shared location if any")
