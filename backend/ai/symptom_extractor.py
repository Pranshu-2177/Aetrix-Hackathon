"""
SwasthAI — Symptom Extractor
Uses Groq AI to extract medical symptom keywords from raw text.
Falls back to basic extraction when Groq is not configured.
"""

import json
import re
from typing import List
from config import settings

# Common symptom keywords for fallback extraction
COMMON_SYMPTOMS = [
    "fever", "headache", "cough", "cold", "pain", "vomiting", "nausea",
    "diarrhea", "fatigue", "weakness", "dizziness", "rash", "swelling",
    "bleeding", "burn", "wound", "fracture", "sprain", "infection",
    "sore throat", "runny nose", "body ache", "joint pain", "stomach pain",
    "chest pain", "back pain", "shortness of breath", "difficulty breathing",
    "loss of appetite", "weight loss", "insomnia", "anxiety", "itching",
    "numbness", "tingling", "blurred vision", "ear pain", "toothache",
]


async def extract_symptoms(text: str) -> List[str]:
    """Extract medical symptom keywords from raw text."""
    if settings.has_groq:
        return await _extract_with_groq(text)
    return _extract_fallback(text)


async def _extract_with_groq(text: str) -> List[str]:
    """Use Groq API to extract symptoms."""
    try:
        from groq import Groq
        from ai.prompts import SYMPTOM_EXTRACTION_PROMPT

        client = Groq(api_key=settings.GROQ_API_KEY)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a medical symptom extractor. Respond only with a JSON array."},
                {"role": "user", "content": SYMPTOM_EXTRACTION_PROMPT.format(text=text)},
            ],
            temperature=0.1,
            max_tokens=200,
        )

        result = response.choices[0].message.content.strip()
        # Clean markdown code blocks if present
        result = re.sub(r'```json\s*', '', result)
        result = re.sub(r'```\s*', '', result)
        symptoms = json.loads(result)
        return symptoms if isinstance(symptoms, list) else [text]

    except Exception as e:
        print(f"[SymptomExtractor] Groq error, falling back: {e}")
        return _extract_fallback(text)


def _extract_fallback(text: str) -> List[str]:
    """Basic keyword matching fallback when Groq is not available."""
    text_lower = text.lower()
    found = [s for s in COMMON_SYMPTOMS if s in text_lower]
    # If no common symptoms found, return the raw text as a single symptom
    return found if found else [text.strip()]
