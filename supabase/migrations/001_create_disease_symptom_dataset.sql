-- Disease-Symptom Dataset Table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Drop if exists (for re-runs during dev)
DROP TABLE IF EXISTS disease_symptom_dataset;

-- Main table: one row per patient/case record
-- disease: the diagnosed condition
-- symptoms: JSONB object with symptom names as keys, 0/1 as values
CREATE TABLE disease_symptom_dataset (
  id BIGSERIAL PRIMARY KEY,
  disease TEXT NOT NULL,
  symptoms JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for filtering by disease
CREATE INDEX idx_disease_symptom_dataset_disease ON disease_symptom_dataset(disease);

-- GIN index for JSONB queries (e.g., symptom lookups)
CREATE INDEX idx_disease_symptom_dataset_symptoms ON disease_symptom_dataset USING GIN(symptoms);

-- RLS: Use service_role key for upload script (bypasses RLS). Adjust policies for your auth.
ALTER TABLE disease_symptom_dataset ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access" ON disease_symptom_dataset FOR SELECT USING (true);
CREATE POLICY "Allow insert for upload" ON disease_symptom_dataset FOR INSERT WITH CHECK (true);
