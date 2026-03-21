#!/bin/bash
# 1. Create table in Supabase
# 2. Upload dataset1.csv

set -e
cd "$(dirname "$0")/.."

echo "=========================================="
echo "Step 1: Create table in Supabase"
echo "=========================================="
echo ""
echo "Open: https://supabase.com/dashboard/project/ricbzdatnjkrdhvqgrph/sql/new"
echo ""
echo "Copy and run the SQL from: supabase/migrations/001_create_disease_symptom_dataset.sql"
echo ""
read -p "Press Enter when the table is created..."

echo ""
echo "=========================================="
echo "Step 2: Upload dataset1.csv"
echo "=========================================="
source .venv/bin/activate
python scripts/upload_dataset_to_supabase.py
echo ""
echo "Done!"
