"""LLM client for Groq inference."""

import os
import json
from groq import AsyncGroq

_client = None

def get_groq_client() -> AsyncGroq:
    """Return the global AsyncGroq client instance."""
    global _client
    if _client is None:
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY must be set in environment variables.")
        _client = AsyncGroq(api_key=api_key)
    return _client
