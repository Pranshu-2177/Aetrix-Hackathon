"""AI triage service with a deterministic fallback for the MVP."""

from __future__ import annotations

import json
import re
from typing import Any, Dict, List

from backend.config import settings

VALID_TRIAGE_LEVELS = {"self-care", "clinic", "emergency"}

DEFAULT_ACTIONS = {
    "self-care": [
        "Rest, hydrate, and monitor symptoms for the next 24 hours.",
        "Use basic over-the-counter relief only if it is normally safe for you.",
        "Get medical help sooner if symptoms worsen, spread, or new red flags appear.",
    ],
    "clinic": [
        "Book a clinic visit within the next 24 to 48 hours.",
        "Track when symptoms started and whether they are getting worse.",
        "Seek urgent care sooner if you develop breathing trouble, severe pain, or fainting.",
    ],
    "emergency": [
        "Call 108 or go to the nearest emergency department now.",
        "Do not wait to see if it settles on its own.",
        "If possible, have someone stay with you while you seek care.",
    ],
}


async def run_triage(text: str) -> Dict[str, Any]:
    """Classify the urgency of a symptom description."""
    if settings.has_groq:
        return await _triage_with_groq(text)
    return _triage_fallback(text)


async def _triage_with_groq(text: str) -> Dict[str, Any]:
    """Use Groq for triage and degrade cleanly if the model call fails."""
    try:
        from groq import Groq

        from backend.ai.prompts import TRIAGE_PROMPT

        client = Groq(api_key=settings.GROQ_API_KEY)
        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a health triage assistant. Return only valid JSON.",
                },
                {
                    "role": "user",
                    "content": TRIAGE_PROMPT.format(text=text),
                },
            ],
            temperature=0.1,
            max_tokens=300,
        )

        content = response.choices[0].message.content.strip()
        content = re.sub(r"```json\s*", "", content)
        content = re.sub(r"```\s*", "", content)
        parsed = json.loads(content)

        triage = parsed.get("triage", "clinic")
        if triage not in VALID_TRIAGE_LEVELS:
            triage = "clinic"

        reason = str(parsed.get("reason", "Symptoms need clinician review.")).strip()
        confidence = _clamp_confidence(parsed.get("confidence", 0.7))
        recommended_actions = _normalize_actions(parsed.get("recommended_actions"), triage)

        return {
            "triage": triage,
            "reason": reason,
            "confidence": confidence,
            "recommended_actions": recommended_actions,
        }
    except Exception as exc:
        print(f"[Triage] Groq failed, using fallback: {exc}")
        return _triage_fallback(text)


def _triage_fallback(text: str) -> Dict[str, Any]:
    """Simple keyword-based fallback so the API still works without Groq."""
    lower_text = text.lower()

    emergency_keywords = [
        "chest pain",
        "can't breathe",
        "cannot breathe",
        "shortness of breath",
        "heavy bleeding",
        "unconscious",
        "seizure",
    ]
    if any(keyword in lower_text for keyword in emergency_keywords):
        return {
            "triage": "emergency",
            "reason": "Your symptoms include emergency warning signs that need immediate medical attention.",
            "confidence": 0.95,
            "recommended_actions": DEFAULT_ACTIONS["emergency"],
        }

    clinic_keywords = [
        "persistent",
        "days",
        "weeks",
        "worsening",
        "swelling",
        "pus",
        "infection",
        "high fever",
        "severe pain",
        "vomiting",
        "diarrhea",
    ]
    if any(keyword in lower_text for keyword in clinic_keywords):
        return {
            "triage": "clinic",
            "reason": "The symptoms sound persistent or significant enough to need a clinician review.",
            "confidence": 0.72,
            "recommended_actions": DEFAULT_ACTIONS["clinic"],
        }

    return {
        "triage": "self-care",
        "reason": "The symptoms sound mild based on the information provided, so home monitoring is reasonable for now.",
        "confidence": 0.64,
        "recommended_actions": DEFAULT_ACTIONS["self-care"],
    }


def _clamp_confidence(value: Any) -> float:
    """Convert model output into a bounded float."""
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return 0.7
    return max(0.0, min(1.0, numeric))


def _normalize_actions(actions: Any, triage: str) -> List[str]:
    """Return a clean list of action strings, with fallbacks if the model response is weak."""
    if not isinstance(actions, list):
        return DEFAULT_ACTIONS[triage]

    cleaned = [str(action).strip() for action in actions if str(action).strip()]
    if not cleaned:
        return DEFAULT_ACTIONS[triage]
    return cleaned[:4]
