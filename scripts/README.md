# Scripts

## Upload dataset to Supabase

Uploads `dataset.csv` (disease–symptom training data) to Supabase.

### 1. Create the table

In [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor, run:

```
supabase/migrations/001_create_disease_symptom_dataset.sql
```

### 2. Configure credentials

In `backend/.env`:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
```

Use the **service role** key (not anon) for bulk inserts.

### 3. Run the upload

Use a virtual environment (required on macOS with Homebrew Python):

```bash
cd /Users/pritpatel/Desktop/SwasthAI
python3 -m venv .venv
source .venv/bin/activate
pip install python-dotenv supabase
python scripts/upload_dataset_to_supabase.py
```
