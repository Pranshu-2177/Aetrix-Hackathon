#!/usr/bin/env python3
"""
Create dataset1.csv: one row per disease with "common" symptom profile.
Aggregates dataset.csv by disease using majority vote (>50% have symptom = 1).
"""

import csv
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main():
    csv_path = ROOT / "dataset.csv"
    out_path = ROOT / "dataset1.csv"

    if not csv_path.exists():
        print(f"Error: {csv_path} not found")
        return 1

    print("Reading dataset.csv...")
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        columns = next(reader)
        symptom_cols = columns[1:]
        by_disease = defaultdict(list)

        for row in reader:
            if not row:
                continue
            disease = (row[0] or "").strip()
            vals = []
            for v in (row[1:] if len(row) > 1 else []):
                try:
                    vals.append(int(v) if str(v).strip() in ("0", "1") else 0)
                except (ValueError, TypeError):
                    vals.append(0)
            # Pad if row shorter than expected
            while len(vals) < len(symptom_cols):
                vals.append(0)
            by_disease[disease].append(vals[: len(symptom_cols)])

    print(f"  Unique diseases: {len(by_disease)}")

    print("Computing common symptom profile per disease (majority vote)...")
    rows_out = []
    for disease, symptom_rows in by_disease.items():
        n = len(symptom_rows)
        common = []
        for i in range(len(symptom_cols)):
            ones = sum(r[i] for r in symptom_rows)
            common.append(1 if ones > n / 2 else 0)
        rows_out.append([disease] + common)

    print(f"Writing {out_path}...")
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(columns)
        writer.writerows(rows_out)

    print(f"Done. dataset1.csv has {len(rows_out)} rows (one per disease).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
