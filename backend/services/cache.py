"""
SwasthAI — Redis Cache Service
Optional caching layer for frequent queries.
Degrades silently if Redis is not available.
"""

from typing import Optional
from config import settings

_client = None


def _get_redis():
    """Get Redis client. Returns None if not configured."""
    global _client
    if _client:
        return _client

    if not settings.has_redis:
        return None

    try:
        import redis
        _client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        _client.ping()
        return _client
    except Exception as e:
        print(f"[Cache] Redis connection error: {e}")
        return None


async def cache_get(key: str) -> Optional[str]:
    """Get a cached value by key."""
    client = _get_redis()
    if not client:
        return None
    try:
        return client.get(key)
    except Exception:
        return None


async def cache_set(key: str, value: str, ttl_seconds: int = 3600):
    """Set a cached value with TTL (default 1 hour)."""
    client = _get_redis()
    if not client:
        return
    try:
        client.setex(key, ttl_seconds, value)
    except Exception:
        pass
