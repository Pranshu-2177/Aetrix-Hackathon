#!/usr/bin/env python3
"""
Enrich dataset1.csv with common problems (heart attack, stroke, etc.) and expand to 1000 rows.
Updates symptom profiles for critical conditions and adds variant rows for common diseases.
"""

import csv
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
DATASET = ROOT / "dataset1.csv"
OUTPUT = ROOT / "dataset1.csv"

# Enhanced symptom profiles - use EXACT column names from dataset1.csv
COMMON_CONDITIONS = {
    "heart attack": [
        "sharp chest pain", "chest tightness", "shortness of breath", "difficulty breathing",
        "burning chest pain", "sweating", "palpitations", "dizziness", "weakness", "arm pain",
        "nausea", "fatigue", "feeling ill", "anxiety and nervousness", "fainting"
    ],
    "stroke": [
        "slurring words", "focal weakness", "loss of sensation", "difficulty speaking",
        "dizziness", "headache", "double vision", "disturbance of memory", "fainting",
        "weakness", "arm weakness", "leg weakness", "symptoms of the face"
    ],
    "myocardial infarction": [
        "sharp chest pain", "chest tightness", "shortness of breath", "difficulty breathing",
        "burning chest pain", "sweating", "palpitations", "dizziness", "weakness", "arm pain",
        "nausea", "fatigue", "anxiety and nervousness"
    ],
    "diabetes": [
        "thirst", "polyuria", "fatigue", "recent weight loss", "weakness",
        "diminished vision", "excessive urination at night", "difficulty eating"
    ],
    "hypertension": [
        "headache", "dizziness", "diminished vision", "fatigue", "chest tightness",
        "shortness of breath", "palpitations"
    ],
    "asthma": [
        "wheezing", "shortness of breath", "difficulty breathing", "cough",
        "congestion in chest", "chest tightness", "breathing fast"
    ],
    "pneumonia": [
        "fever", "cough", "difficulty breathing", "shortness of breath",
        "chills", "fatigue", "sharp chest pain", "coughing up sputum", "feeling ill"
    ],
    "influenza": [
        "fever", "cough", "fatigue", "muscle pain", "headache", "sore throat",
        "coryza", "chills", "feeling ill", "ache all over"
    ],
    "covid-19": [
        "fever", "cough", "shortness of breath", "difficulty breathing",
        "fatigue", "disturbance of smell or taste", "headache", "sore throat", "diarrhea"
    ],
    "anxiety": [
        "anxiety and nervousness", "palpitations", "sweating", "restlessness",
        "insomnia", "chest tightness", "shortness of breath", "dizziness"
    ],
    "depression": [
        "depression", "emotional symptoms", "fatigue", "sleepiness",
        "decreased appetite", "insomnia", "disturbance of memory"
    ],
    "migraine": [
        "headache", "nausea", "vomiting", "spots or clouds in vision",
        "diminished vision", "dizziness"
    ],
    "appendicitis": [
        "sharp abdominal pain", "lower abdominal pain", "nausea", "vomiting",
        "fever", "decreased appetite", "feeling ill"
    ],
    "urinary tract infection": [
        "painful urination", "frequent urination", "lower abdominal pain",
        "blood in urine", "fever", "feeling ill"
    ],
    "gastroenteritis": [
        "diarrhea", "vomiting", "nausea", "sharp abdominal pain",
        "fever", "fatigue", "decreased appetite"
    ],
    "common cold": [
        "cough", "sore throat", "coryza", "nasal congestion",
        "headache", "sneezing", "fatigue"
    ],
    "allergic reaction": [
        "allergic reaction", "skin rash", "itching of skin", "shortness of breath",
        "skin swelling", "sneezing", "coryza"
    ],
    "kidney stone": [
        "sharp abdominal pain", "side pain", "painful urination", "blood in urine",
        "nausea", "vomiting", "frequent urination"
    ],
    "bronchitis": [
        "cough", "coughing up sputum", "shortness of breath", "fatigue",
        "fever", "chest tightness", "congestion in chest"
    ],
}


def main():
    print("Reading dataset1.csv...")
    with open(DATASET, newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        columns = next(reader)
        symptom_cols = [c for c in columns if c != "diseases"]

    # Load existing data
    existing = {}
    rows = []
    with open(DATASET, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            disease = row.get("diseases", "").strip()
            existing[disease.lower()] = row
            rows.append(row)

    # Update or add common conditions with enhanced profiles
    updated = 0
    for condition, symptoms in COMMON_CONDITIONS.items():
        symptom_set = set(s.lower() for s in symptoms)
        row_dict = {"diseases": condition}
        for col in symptom_cols:
            row_dict[col] = "1" if col.lower() in symptom_set else "0"

        key = condition.lower()
        if key in existing:
            # Merge: keep 1 where either has 1
            for col in symptom_cols:
                old_val = str(existing[key].get(col, "0")).strip()
                new_val = row_dict.get(col, "0")
                row_dict[col] = "1" if (old_val == "1" or new_val == "1") else "0"
            for i, r in enumerate(rows):
                if r.get("diseases", "").strip().lower() == key:
                    rows[i] = row_dict
                    updated += 1
                    break
        else:
            rows.append(row_dict)
            updated += 1

    # Add variant rows for top common conditions to reach 1000
    import random
    random.seed(42)
    target = 1000
    priority_diseases = [
        "heart attack", "stroke", "diabetes", "hypertension", "asthma",
        "pneumonia", "influenza", "anxiety", "depression", "migraine",
        "panic disorder", "typhoid fever", "common cold", "gastroenteritis",
        "covid-19", "bronchitis", "urinary tract infection", "appendicitis"
    ]

    by_disease = defaultdict(list)
    for r in rows:
        by_disease[r.get("diseases", "").strip().lower()].append(r)

    added = 0
    idx = 0
    while len(rows) < target and added < 350:
        disease = priority_diseases[idx % len(priority_diseases)]
        key = disease.lower()
        if key in by_disease:
            base_row = dict(by_disease[key][0])
            cols_with_one = [c for c in symptom_cols if str(base_row.get(c, "0")) == "1"]
            cols_with_zero = [c for c in symptom_cols if str(base_row.get(c, "0")) == "0"]
            if cols_with_one and random.random() < 0.4:
                c = random.choice(cols_with_one)
                base_row[c] = "0"
            if cols_with_zero and random.random() < 0.25:
                c = random.choice(cols_with_zero)
                base_row[c] = "1"
            base_row["diseases"] = disease
            rows.append(base_row)
            by_disease[key].append(base_row)
            added += 1
        idx += 1

    print(f"Rows: {len(rows)} (target 1000)")
    print(f"Updated/enhanced {updated} common conditions")

    with open(OUTPUT, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=columns, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)

    print(f"Written to {OUTPUT}")


if __name__ == "__main__":
    main()
