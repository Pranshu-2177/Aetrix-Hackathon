"""
SwasthAI — Symptom Extractor for Dataset Matching
Maps user text to a symptom dict (column_name -> 0/1) for disease prediction.
"""

from __future__ import annotations

import re
from typing import Dict, Tuple

from backend.ai.disease_predictor import get_symptom_columns


def extract_symptoms_from_text(text: str) -> Tuple[Dict[str, int], int]:
    """
    Extract symptom profile from user text for dataset matching.
    Returns (symptoms_dict, days) where symptoms_dict maps dataset column names to 0 or 1.
    """
    text_lower = text.lower()
    symptom_cols = get_symptom_columns()
    symptoms: Dict[str, int] = {}

    for col in symptom_cols:
        # Substring match: column name appears in user text
        symptoms[col] = 1 if col.lower() in text_lower else 0

    # Extract days mentioned
    days = 0
    match = re.search(r"(\d+)\s*day", text_lower)
    if match:
        days = int(match.group(1))

    return symptoms, days
