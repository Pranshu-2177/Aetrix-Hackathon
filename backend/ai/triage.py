"""LLM-backed triage service with low-information handling."""

from __future__ import annotations

import json
import re
from typing import Any, Dict, List

from backend.config import settings
from backend.ai.prompts import TRIAGE_PROMPT
from backend.ai.llm_client import get_groq_client

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

DEFAULT_MORE_INFO = {
    "triage": "self-care",
    "reason": "Please tell me your symptoms so I can guide you safely.",
    "confidence": 0.15,
    "triage_engine": "fallback",
    "recommended_actions": [],
    "needs_more_info": True,
    "follow_up_questions": [
        "What symptoms are you having right now?",
        "How long have you had them?",
    ],
}

LOW_INFO_INPUTS = {
    "hi",
    "hello",
    "hey",
    "hii",
    "ok",
    "okay",
    "yes",
    "no",
    "1",
    "2",
    "3",
    "4",
}


def _looks_like_low_info(text: str) -> bool:
    normalized = re.sub(r"\s+", " ", text.strip().lower())
    return normalized in LOW_INFO_INPUTS or len(re.sub(r"[^a-z0-9]", "", normalized)) <= 1


def _normalize_llm_response(payload: Dict[str, Any]) -> Dict[str, Any]:
    triage = str(payload.get("triage", "self-care")).strip().lower()
    if triage not in VALID_TRIAGE_LEVELS:
        triage = "self-care"

    needs_more_info = bool(payload.get("needs_more_info", False))
    follow_up_questions = payload.get("follow_up_questions", [])
    if not isinstance(follow_up_questions, list):
        follow_up_questions = []
    follow_up_questions = [str(item).strip() for item in follow_up_questions if str(item).strip()][:2]

    recommended_actions = payload.get("recommended_actions", [])
    if not isinstance(recommended_actions, list):
        recommended_actions = []
    recommended_actions = [str(item).strip() for item in recommended_actions if str(item).strip()][:4]

    if needs_more_info:
        recommended_actions = []
        if not follow_up_questions:
            follow_up_questions = DEFAULT_MORE_INFO["follow_up_questions"]

    return {
        "triage": triage,
        "reason": str(payload.get("reason", "")).strip() or DEFAULT_MORE_INFO["reason"],
        "confidence": _clamp_confidence(payload.get("confidence")),
        "triage_engine": "groq",
        "recommended_actions": recommended_actions or (DEFAULT_ACTIONS[triage] if not needs_more_info else []),
        "needs_more_info": needs_more_info,
        "follow_up_questions": follow_up_questions,
    }


async def run_triage(text: str) -> Dict[str, Any]:
    """Classify the urgency of a symptom description using an LLM."""
    if _looks_like_low_info(text):
        return DEFAULT_MORE_INFO.copy()
    return await _triage_llm(text)


async def _triage_llm(text: str) -> Dict[str, Any]:
    """Call the LLM to get the triage response."""
    client = get_groq_client()
    try:
        completion = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": TRIAGE_PROMPT.format(text=text)
                }
            ],
            temperature=0.0,
            max_tokens=256,
            response_format={"type": "json_object"}
        )
        response_text = completion.choices[0].message.content
        if response_text is None:
            raise ValueError("No text returned from LLM")
        return _normalize_llm_response(json.loads(response_text))
    except Exception as e:
        import logging
        logging.getLogger(__name__).exception("LLM generation failed, falling back to rule-based triage.")
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
            "triage_engine": "fallback",
            "recommended_actions": DEFAULT_ACTIONS["emergency"],
            "needs_more_info": False,
            "follow_up_questions": [],
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
            "triage_engine": "fallback",
            "recommended_actions": DEFAULT_ACTIONS["clinic"],
            "needs_more_info": False,
            "follow_up_questions": [],
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
            "triage_engine": "fallback",
            "recommended_actions": DEFAULT_ACTIONS["clinic"],
            "needs_more_info": False,
            "follow_up_questions": [],
        }

    return {
        "triage": "self-care",
        "reason": "Mild symptoms can be monitored at home for now if there are no danger signs.",
        "confidence": 0.68,
        "triage_engine": "fallback",
        "recommended_actions": DEFAULT_ACTIONS["self-care"],
        "needs_more_info": False,
        "follow_up_questions": [],
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
