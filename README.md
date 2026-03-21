# SwasthAI

SwasthAI is a rural-first multilingual health triage assistant.

It currently supports:

- web chatbot for patients and families
- web chatbot for ASHA workers
- district admin summary page shell
- text input and browser voice input
- rule-based triage into `self-care`, `clinic`, or `emergency`
- nearby facility suggestions from a demo dataset
- optional Google Translate integration with local fallback
- Supabase logging for sessions, messages, and triage results
- simple disease matching from `dataset1.csv` or Supabase dataset table

Brutal truth:

- this is still a hackathon MVP, not a clinical product
- the district admin page is mostly a frontend shell
- hospital lookup is demo-grade, not a real nationwide facility network
- WhatsApp webhook exists, but full WhatsApp bot delivery is still incomplete
- disease matching is basic symptom matching, not real diagnosis

## Current Frontend

The frontend is a `Vite + React + React Router + TypeScript + Tailwind + shadcn/ui` app.

It is not a Next.js app.

Current user pages:

- `/patients`
- `/asha-workers`
- `/district-admin`

## Current Backend

The backend is a `FastAPI` app.

Main routes:

- `POST /analyze`
- `GET /facilities/nearby`
- `POST /whatsapp/webhook`
- `GET /health`

Current backend flow:

1. accept text or voice transcript
2. detect or use selected language
3. translate to English if needed
4. check emergency keywords
5. run rule-based triage
6. match symptoms to a basic disease dataset
7. return next steps and nearby facilities
8. save logs to Supabase if configured

## Project Structure

```text
frontend/
  src/
    components/
    lib/
    pages/

backend/
  ai/
  models/
  routes/
  services/
  tests/

scripts/
supabase/
```

## Run Locally

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
python3 -m venv backend/venv
backend/venv/bin/pip install -r backend/requirements.txt
backend/venv/bin/python -m uvicorn backend.main:app --reload
```

## Environment Variables

Use a root `.env` file for backend configuration.

Example:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key
GROQ_API_KEY=your_groq_api_key
```

Notes:

- `SUPABASE_URL` and `SUPABASE_KEY` enable session/message/triage logging
- `GOOGLE_TRANSLATE_API_KEY` is optional; if missing, local translation fallback is used
- `DEEPGRAM_API_KEY` is not the active web voice path right now
- browser voice currently uses the Web Speech API on supported browsers

## Supabase

Current tables used by the live backend:

- `sessions`
- `messages`
- `triage_results`

Optional dataset table:

- `disease_symptom_dataset`

Helpful files:

- `backend/supabase_mvp_schema.sql`
- `supabase/migrations/001_create_disease_symptom_dataset.sql`
- `scripts/upload_dataset_to_supabase.py`

Important:

- `dataset.csv` is too large for normal GitHub commits and is intentionally not tracked
- `dataset1.csv` is the smaller tracked sample dataset used locally

## Example API Request

### `POST /analyze`

```json
{
  "text": "I have fever for 3 days and vomiting",
  "language": "en",
  "channel": "web"
}
```

Example response:

```json
{
  "session_id": "session-abc123",
  "language": "en",
  "disease": "viral fever",
  "triage": "clinic",
  "reason": "Persistent fever, cough, diarrhea, vomiting, or worsening symptoms should be checked at a clinic soon.",
  "confidence": 0.78,
  "recommended_actions": [
    "Visit the nearest PHC or clinic within the next 24 to 48 hours.",
    "Monitor whether the symptoms are lasting longer, getting worse, or spreading.",
    "Go sooner if you develop chest pain, breathing trouble, confusion, or fainting."
  ],
  "facilities": [],
  "is_emergency": false,
  "disclaimer": "This gives quick guidance only. It is not a doctor's final advice. If you feel worse or feel unsafe, go to a doctor or hospital."
}
```

## Testing

Frontend:

```bash
cd frontend
npm test
npm run build
```

Backend:

```bash
backend/venv/bin/python -m unittest backend.tests.test_analyze backend.tests.test_translator
```

## What Is Still Missing

- real WhatsApp end-to-end bot flow
- real audio upload transcription pipeline
- image analysis in the live request path
- real facility database and map integrations
- real district analytics backend
- stronger medical safety and validation
- production-grade auth, RLS, and access control

## Safety Note

SwasthAI gives quick triage guidance only.

It is not a doctor, not a diagnosis engine, and not a replacement for emergency care.
