#!/usr/bin/env python3
"""
Upload dataset.csv to Supabase disease_symptom_dataset table.

Prerequisites:
  1. Run the migration: supabase/migrations/001_create_disease_symptom_dataset.sql in Supabase SQL Editor
  2. Set SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY) in backend/.env

Usage:
  python scripts/upload_dataset_to_supabase.py
  # or from project root:
  PYTHONPATH=. python scripts/upload_dataset_to_supabase.py
"""

import csv
import os
import sys
from pathlib import Path

# Add project root for imports
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

os.chdir(ROOT)


def main():
    from dotenv import load_dotenv
    load_dotenv(ROOT / "backend" / ".env")
    load_dotenv(ROOT / ".env")  # root .env overrides

    url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

    if not url or not key:
        print("Error: Set SUPABASE_URL and SUPABASE_KEY in .env or backend/.env")
        sys.exit(1)

    from supabase import create_client
    client = create_client(url, key)

    csv_path = ROOT / "dataset1.csv"
    if not csv_path.exists():
        print(f"Error: dataset1.csv not found at {csv_path}")
        sys.exit(1)

    batch_size = 50
    total = 0

    print("Reading dataset1.csv...")
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        columns = next(reader)
        symptom_cols = columns[1:]  # skip 'diseases'
        print(f"  Columns: {len(columns)} (1 disease + {len(symptom_cols)} symptoms)")

        batch = []
        for row in reader:
            disease = (row[0] or "").strip()
            symptoms = {}
            for col, val in zip(symptom_cols, row[1:] if len(row) > 1 else []):
                try:
                    symptoms[col] = int(val) if str(val).strip() in ("0", "1") else 0
                except (ValueError, TypeError):
                    symptoms[col] = 0
            # Fill missing symptom columns as 0
            for col in symptom_cols:
                if col not in symptoms:
                    symptoms[col] = 0

            batch.append({"disease": disease, "symptoms": symptoms})

            if len(batch) >= batch_size:
                client.table("disease_symptom_dataset").insert(batch).execute()
                total += len(batch)
                print(f"  Inserted {total} rows...")
                batch = []

        if batch:
            client.table("disease_symptom_dataset").insert(batch).execute()
            total += len(batch)

    print(f"Done. Uploaded {total} rows to disease_symptom_dataset.")


if __name__ == "__main__":
    main()
