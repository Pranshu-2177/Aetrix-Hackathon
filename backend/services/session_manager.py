"""Minimal in-memory session store for MVP development."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Dict, Optional

from backend.services.database import create_session as create_session_record
from backend.services.database import get_session as get_persisted_session
from backend.services.database import save_message as save_message_record

_sessions: Dict[str, dict] = {}
_whatsapp_sessions: Dict[str, str] = {}


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def get_or_create_session(session_id: str, channel: str = "web", language: str = "en") -> dict:
    """Return an existing session or create one in memory and Supabase."""
    if session_id not in _sessions:
        _sessions[session_id] = {
            "session_id": session_id,
            "channel": channel,
            "language": language,
            "created_at": _utc_now(),
            "messages": [],
        }
        await create_session_record(session_id=session_id, channel=channel, language=language)
    return _sessions[session_id]


async def get_or_create_whatsapp_session(phone_number: str) -> str:
    """Map a WhatsApp sender to a stable session id."""
    if phone_number not in _whatsapp_sessions:
        session_id = f"wa-{uuid.uuid4().hex[:12]}"
        _whatsapp_sessions[phone_number] = session_id
        await get_or_create_session(session_id, channel="whatsapp")
    return _whatsapp_sessions[phone_number]


async def add_message(session_id: str, role: str, content: str) -> None:
    """Append a message to the in-memory transcript and persist it when available."""
    session = await get_or_create_session(session_id)
    session["messages"].append(
        {
            "role": role,
            "content": content,
            "timestamp": _utc_now(),
        }
    )
    await save_message_record(session_id=session_id, role=role, content=content)


async def get_session(session_id: str) -> Optional[dict]:
    """Return stored session metadata, falling back to Supabase when needed."""
    if session_id in _sessions:
        return _sessions.get(session_id)
    return await get_persisted_session(session_id)
