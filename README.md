# SwasthAI

SwasthAI is a multilingual AI health triage assistant being built for hackathon-style rapid iteration.

The current MVP only supports one honest path:

- text symptom input
- emergency keyword screening
- AI or fallback triage classification
- structured JSON response
- Vite React frontend wired to the live backend

Everything else in the original architecture is still pending or only partially scaffolded.

## Current project structure

```text
frontend/
├── src/
│   ├── pages/
│   ├── components/
│   └── lib/
└── package.json

backend/
├── ai/
│   ├── emergency.py
│   ├── prompts.py
│   └── triage.py
├── models/
│   ├── request.py
│   └── response.py
├── routes/
│   └── analyze.py
├── services/
│   ├── pipeline.py
│   └── session_manager.py
├── tests/
│   └── test_analyze.py
├── config.py
├── main.py
└── requirements.txt
```

## Frontend stack

The website is a `Vite + React + React Router + TypeScript + Tailwind + shadcn/ui` app.
It is not a Next.js app.

## Run the frontend

From the repo root:

```bash
cd frontend
npm install
npm run dev
```

## Run the backend

From the repo root:

```bash
backend/venv/bin/python -m uvicorn backend.main:app --reload
```

If you are not using the checked-in virtual environment, install dependencies first:

```bash
python3 -m venv backend/venv
backend/venv/bin/pip install -r backend/requirements.txt
```

## MVP API

### `POST /analyze`

Request body:

```json
{
  "text": "I have fever and headache for three days."
}
```

Example response:

```json
{
  "session_id": "session-abc123",
  "triage": "clinic",
  "reason": "The symptoms sound persistent or significant enough to need a clinician review.",
  "confidence": 0.72,
  "recommended_actions": [
    "Book a clinic visit within the next 24 to 48 hours.",
    "Track when symptoms started and whether they are getting worse.",
    "Seek urgent care sooner if you develop breathing trouble, severe pain, or fainting."
  ],
  "is_emergency": false,
  "disclaimer": "This is AI-assisted triage, not a diagnosis. Seek professional care if symptoms worsen or you are unsure."
}
```

## What is not done yet

- voice input and speech-to-text
- image upload and image analysis
- translation pipeline
- hospital search tied to real map APIs
- text-to-speech responses
- database persistence
- analytics
