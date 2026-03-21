"""
SwasthAI — Database Service
Supabase helpers for storing sessions, messages, triage results, and symptoms.
Falls back silently when Supabase is not configured (local dev).
"""

from __future__ import annotations

from typing import Dict, Optional

from backend.config import settings


def _get_client():
    """Get Supabase client. Returns None if not configured."""
    if not settings.has_supabase:
        return None
    try:
        from supabase import create_client
        return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    except Exception as e:
        print(f"[Database] Supabase connection error: {e}")
        return None


async def create_session(
    session_id: str,
    channel: str,
    language: str,
    location: Optional[dict] = None,
) -> None:
    """Store a new session in the database."""
    client = _get_client()
    if not client:
        return

    try:
        payload = {
            "session_id": session_id,
            "channel": channel,
            "language": language,
        }
        if location is not None:
            payload["location"] = location

        client.table("sessions").upsert(payload).execute()
    except Exception as e:
        print(f"[Database] Error creating session: {e}")


async def save_message(session_id: str, role: str, content: str) -> None:
    """Save a chat message to the database."""
    client = _get_client()
    if not client:
        return

    try:
        client.table("messages").insert({
            "session_id": session_id,
            "role": role,
            "content": content,
        }).execute()
    except Exception as e:
        print(f"[Database] Error saving message: {e}")


async def save_triage_result(session_id: str, triage_level: str, confidence: float, reason: str) -> None:
    """Store a triage result."""
    client = _get_client()
    if not client:
        return

    try:
        client.table("triage_results").insert({
            "session_id": session_id,
            "triage": triage_level,
            "confidence": confidence,
            "reason": reason,
        }).execute()
    except Exception as e:
        print(f"[Database] Error saving triage result: {e}")


async def get_session(session_id: str) -> Optional[Dict]:
    """Retrieve a session by ID."""
    client = _get_client()
    if not client:
        return None

    try:
        result = client.table("sessions").select("*").eq("session_id", session_id).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        print(f"[Database] Error getting session: {e}")
        return None
