import { AnalyzeRequest, AnalyzeResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const SESSION_STORAGE_KEY = 'swasthai_session_id';

export async function analyzeSymptoms(data: AnalyzeRequest): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    let detail = 'API request failed';

    try {
      const body = await res.json();
      if (typeof body?.detail === 'string') {
        detail = body.detail;
      }
    } catch {
      // Ignore JSON parsing errors and keep the default message.
    }

    throw new Error(detail);
  }

  return res.json();
}

export function getOrCreateSessionId(): string {
  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const sessionId = `web-${crypto.randomUUID()}`;
  window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  return sessionId;
}
