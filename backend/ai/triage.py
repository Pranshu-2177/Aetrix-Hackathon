"""Rule-based triage service for the rural-first MVP."""

from __future__ import annotations

from typing import Any, Dict, List

VALID_TRIAGE_LEVELS = {"self-care", "clinic", "emergency"}

DEFAULT_ACTIONS = {
    "self-care": [
        "Rest, drink safe fluids, and monitor symptoms for the next 24 hours.",
        "Use basic home care only if symptoms stay mild and there are no danger signs.",
        "Visit the nearest PHC if symptoms continue beyond 2 days or worsen.",
    ],
    "clinic": [
        "Visit the nearest PHC or clinic within the next 24 to 48 hours.",
        "Monitor whether the symptoms are lasting longer, getting worse, or spreading.",
        "Go sooner if you develop chest pain, breathing trouble, confusion, or fainting.",
    ],
    "emergency": [
        "Call 108 or go to the nearest emergency department now.",
        "Do not rely on home remedies for these symptoms.",
        "If possible, have someone stay with you while you seek help.",
    ],
}


async def run_triage(text: str) -> Dict[str, Any]:
    """Classify the urgency of a symptom description using deterministic rules."""
    return _triage_fallback(text)


def _triage_fallback(text: str) -> Dict[str, Any]:
    """Keyword-based classifier tuned for hackathon MVP triage."""
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

    persistent_keywords = [
        "persistent",
        "days",
        "weeks",
        "worsening",
        "high fever",
        "vomiting",
        "diarrhea",
        "cough",
        "fever",
    ]
    if any(keyword in lower_text for keyword in persistent_keywords):
        return {
            "triage": "clinic",
            "reason": "Persistent fever, cough, diarrhea, vomiting, or worsening symptoms should be checked at a clinic soon.",
            "confidence": 0.78,
            "recommended_actions": DEFAULT_ACTIONS["clinic"],
        }

    clinic_keywords = [
        "swelling",
        "pus",
        "infection",
        "severe pain",
        "wound",
        "burn",
        "rash",
        "dehydration",
    ]
    if any(keyword in lower_text for keyword in clinic_keywords):
        return {
            "triage": "clinic",
            "reason": "Severe pain, swelling, or signs of infection should be assessed by a clinician.",
            "confidence": 0.74,
            "recommended_actions": DEFAULT_ACTIONS["clinic"],
        }

    return {
        "triage": "self-care",
        "reason": "Mild symptoms can be monitored at home for now if there are no danger signs.",
        "confidence": 0.68,
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
