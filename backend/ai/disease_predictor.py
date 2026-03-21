"""
SwasthAI — Disease Predictor
Matches user symptoms against disease data. Fetches from Supabase when configured,
otherwise falls back to local dataset1.csv.
"""

from __future__ import annotations

import csv
import os
from pathlib import Path
from typing import Dict, List, Optional

_ROOT = Path(__file__).resolve().parents[2]
_DATASET_PATH = _ROOT / "dataset1.csv"

_df: Optional[List[Dict]] = None
_columns: Optional[List[str]] = None


def _get_supabase_credentials() -> tuple[str, str]:
    """Resolve Supabase URL/key with service-role preference."""
    try:
        from dotenv import load_dotenv

        load_dotenv(_ROOT / "backend" / ".env")
        load_dotenv(_ROOT / ".env")
    except Exception:
        pass

    url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL") or ""
    key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_KEY")
        or os.getenv("SUPABASE_ANON_KEY")
        or ""
    )
    return url, key


def _load_from_supabase() -> Optional[tuple[List[Dict], List[str]]]:
    """Fetch disease_symptom_dataset from Supabase. Returns None if not configured."""
    try:
        url, key = _get_supabase_credentials()
        if not url or not key:
            return None
        from supabase import create_client
        client = create_client(url, key)
        result = client.table("disease_symptom_dataset").select("disease,symptoms").execute()
        if not result.data:
            return None
        columns_set = set()
        for item in result.data:
            columns_set.update((item.get("symptoms") or {}).keys())
        symptom_cols = sorted(c for c in columns_set if c)
        columns = ["diseases"] + symptom_cols
        rows = []
        for item in result.data:
            disease = item.get("disease", "").strip()
            symptoms = item.get("symptoms") or {}
            record = {"diseases": disease}
            for col in symptom_cols:
                val = symptoms.get(col, 0)
                record[col] = int(val) if val in (0, 1) else 0
            rows.append(record)
        return rows, columns
    except Exception as e:
        print(f"[DiseasePredictor] Supabase fetch failed, using local CSV: {e}")
        return None


def _load_from_csv() -> tuple[List[Dict], List[str]]:
    """Load dataset1.csv into memory."""
    if not _DATASET_PATH.exists():
        return [], []
    rows = []
    with open(_DATASET_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        cols = reader.fieldnames or []
        symptom_cols = [c for c in cols if c != "diseases"]
        for row in reader:
            record = {"diseases": row.get("diseases", "").strip()}
            for col in symptom_cols:
                try:
                    record[col] = int(row.get(col, 0)) if str(row.get(col, "0")).strip() in ("0", "1") else 0
                except (ValueError, TypeError):
                    record[col] = 0
            rows.append(record)
    return rows, cols


def _load_dataset() -> tuple[List[Dict], List[str]]:
    """Load dataset: Supabase first (if configured), else local CSV. Cached after first load."""
    global _df, _columns
    if _df is not None:
        return _df, _columns  # type: ignore

    sb = _load_from_supabase()
    if sb:
        _df, _columns = sb
        return _df, _columns  # type: ignore

    _df, _columns = _load_from_csv()
    return _df, _columns  # type: ignore


def predict_disease(symptoms: Dict[str, int]) -> Optional[str]:
    """
    Find the disease that best matches the given symptom profile.
    symptoms: dict mapping symptom column names to 0 or 1.
    Returns the disease name or None if dataset is empty.
    """
    df, columns = _load_dataset()
    if not df or not columns:
        return None

    symptom_cols = [c for c in columns if c != "diseases"]
    best_match: Optional[str] = None
    max_score = -1

    for row in df:
        score = 0
        for symptom, value in symptoms.items():
            if symptom in row and row[symptom] == value:
                score += 1
        if score > max_score:
            max_score = score
            best_match = row.get("diseases", "")

    return best_match


def get_symptom_columns() -> List[str]:
    """Return list of symptom column names from the dataset."""
    _, columns = _load_dataset()
    return [c for c in (columns or []) if c != "diseases"]
