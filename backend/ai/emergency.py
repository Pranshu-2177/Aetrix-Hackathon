"""Rule-based emergency screening for the MVP."""

from __future__ import annotations

from typing import Dict, List

EMERGENCY_RULES = {
    "cardiac": {
        "keywords": ["chest pain", "crushing chest pain", "heart pain", "chest tightness"],
        "reason": "Possible cardiac emergency. Call 108 or go to the nearest emergency department now.",
    },
    "respiratory": {
        "keywords": ["can't breathe", "cannot breathe", "difficulty breathing", "shortness of breath", "gasping"],
        "reason": "Breathing difficulty can become life-threatening. Get emergency help immediately.",
    },
    "bleeding": {
        "keywords": ["heavy bleeding", "blood won't stop", "severe bleeding", "profuse bleeding"],
        "reason": "Heavy bleeding needs urgent emergency care. Apply direct pressure and call 108.",
    },
    "consciousness": {
        "keywords": ["unconscious", "unresponsive", "collapsed", "seizure", "convulsion"],
        "reason": "Loss of consciousness or seizures require emergency evaluation immediately.",
    },
    "stroke": {
        "keywords": ["face drooping", "arm weakness", "speech difficulty", "sudden confusion", "paralysis"],
        "reason": "Possible stroke. Emergency treatment is time-critical, so seek immediate care.",
    },
}


def check_emergency(symptoms: List[str]) -> Dict[str, object]:
    """Return the first matched emergency signal from a list of symptom strings."""
    combined_text = " ".join(symptoms).lower()

    for condition, rule in EMERGENCY_RULES.items():
        for keyword in rule["keywords"]:
            if keyword in combined_text:
                return {
                    "is_emergency": True,
                    "reason": rule["reason"],
                    "matched_keywords": [keyword],
                    "condition": condition,
                }

    return {
        "is_emergency": False,
        "reason": "",
        "matched_keywords": [],
        "condition": None,
    }


def check_emergency_from_text(text: str) -> Dict[str, object]:
    """Check raw user text for emergency red flags."""
    return check_emergency([text])
