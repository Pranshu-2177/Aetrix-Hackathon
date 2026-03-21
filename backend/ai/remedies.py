"""
SwasthAI — Remedy Generator
Uses Groq AI to generate safe home remedies based on symptoms and triage level.
Falls back to common remedies when Groq is not configured.
"""

import json
import re
from typing import List
from config import settings


async def generate_remedies(symptoms: str, triage: str) -> List[str]:
    """
    Generate safe home remedies. Returns empty list for emergencies.
    """
    if triage == "emergency":
        return ["Seek emergency medical help immediately", "Call 108 for ambulance"]

    if settings.has_groq:
        return await _remedies_with_groq(symptoms, triage)
    return _remedies_fallback(symptoms)


async def _remedies_with_groq(symptoms: str, triage: str) -> List[str]:
    """Use Groq API for AI-generated remedies."""
    try:
        from groq import Groq
        from ai.prompts import REMEDY_PROMPT

        prompt = REMEDY_PROMPT.format(symptoms=symptoms, triage=triage)

        client = Groq(api_key=settings.GROQ_API_KEY)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a medical advisor. Respond only with a JSON array of remedy strings."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=300,
        )

        result = response.choices[0].message.content.strip()
        # Clean markdown code blocks if present
        result = re.sub(r'```json\s*', '', result)
        result = re.sub(r'```\s*', '', result)
        remedies = json.loads(result)
        return remedies if isinstance(remedies, list) else _remedies_fallback(symptoms)

    except Exception as e:
        print(f"[Remedies] Groq error, falling back: {e}")
        return _remedies_fallback(symptoms)


# Fallback common remedies by symptom
COMMON_REMEDIES = {
    "fever": ["Rest and sleep well", "Drink plenty of fluids", "Take paracetamol if temperature exceeds 101°F", "Use a cool compress on forehead"],
    "headache": ["Rest in a dark, quiet room", "Drink water (dehydration is a common cause)", "Apply a cold compress to temples", "Avoid screen time"],
    "cough": ["Drink warm water with honey and lemon", "Gargle with warm salt water", "Use steam inhalation", "Avoid cold drinks and dusty environments"],
    "cold": ["Drink warm fluids (soup, tea)", "Rest adequately", "Use steam inhalation", "Take vitamin C rich foods"],
    "pain": ["Rest the affected area", "Apply ice pack for 15-20 minutes", "Take an over-the-counter pain reliever if needed", "Seek medical help if pain persists"],
    "vomiting": ["Sip small amounts of clear fluids", "Avoid solid food for a few hours", "Try ginger tea or peppermint", "Seek help if vomiting persists beyond 24 hours"],
    "diarrhea": ["Stay hydrated with ORS (oral rehydration solution)", "Eat bland foods (rice, banana, toast)", "Avoid dairy and spicy foods", "Seek help if symptoms last beyond 2 days"],
    "wound": ["Clean the wound with clean water", "Apply antiseptic ointment", "Cover with a clean bandage", "Watch for signs of infection (redness, swelling, pus)"],
    "rash": ["Avoid scratching", "Apply calamine lotion", "Take an antihistamine if itchy", "See a doctor if rash spreads or has blisters"],
    "burn": ["Run cool (not cold) water over the burn for 10 minutes", "Do not apply ice or butter", "Cover with a clean, non-stick bandage", "Seek medical help for large or deep burns"],
}


def _remedies_fallback(symptoms: str) -> List[str]:
    """Generate remedies based on keyword matching."""
    symptoms_lower = symptoms.lower()
    remedies = []

    for symptom, remedy_list in COMMON_REMEDIES.items():
        if symptom in symptoms_lower:
            remedies.extend(remedy_list)

    if not remedies:
        remedies = [
            "Rest and monitor your symptoms",
            "Stay hydrated by drinking water and fluids",
            "Avoid strenuous activity",
            "Seek medical help if symptoms worsen or persist beyond 2 days",
        ]

    # Deduplicate while preserving order
    seen = set()
    unique_remedies = []
    for r in remedies:
        if r not in seen:
            seen.add(r)
            unique_remedies.append(r)

    return unique_remedies[:5]
