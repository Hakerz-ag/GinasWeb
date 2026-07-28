"""Redis cache utility (Upstash-compatible).

Falls back to a no-op when REDIS_URL is not set, so local dev works
without Redis. All callers should handle None returns gracefully.

Usage:
    from app.services.cache import cache_get, cache_set, cache_delete_pattern

    cached = cache_get("classes:all")
    if cached is not None:
        return cached
    result = compute_result()
    cache_set("classes:all", result, ttl=300)
    return result
"""

import json
import logging
from typing import Any

logger = logging.getLogger(__name__)

_redis = None
_unavailable = False  # Suppress repeated connection warnings


def _get_redis():
    global _redis, _unavailable
    if _redis is not None:
        return _redis
    if _unavailable:
        return None
    try:
        from app.config import get_settings
        url = get_settings().redis_url
        if not url:
            _unavailable = True
            return None
        import redis as redis_lib
        _redis = redis_lib.from_url(url, decode_responses=True, socket_connect_timeout=2)
        _redis.ping()
        logger.info("Redis cache connected.")
        return _redis
    except Exception as exc:
        logger.warning("Redis unavailable — caching disabled: %s", exc)
        _unavailable = True
        return None


def cache_get(key: str) -> Any | None:
    """Return cached value or None if missing / Redis unavailable."""
    r = _get_redis()
    if r is None:
        return None
    try:
        raw = r.get(key)
        return json.loads(raw) if raw is not None else None
    except Exception as exc:
        logger.warning("cache_get(%s) failed: %s", key, exc)
        return None


def cache_set(key: str, value: Any, ttl: int = 300) -> None:
    """Store value as JSON with TTL seconds. No-op if Redis unavailable."""
    r = _get_redis()
    if r is None:
        return
    try:
        r.setex(key, ttl, json.dumps(value))
    except Exception as exc:
        logger.warning("cache_set(%s) failed: %s", key, exc)


def cache_delete(key: str) -> None:
    """Delete a single key. No-op if Redis unavailable."""
    r = _get_redis()
    if r is None:
        return
    try:
        r.delete(key)
    except Exception as exc:
        logger.warning("cache_delete(%s) failed: %s", key, exc)


def cache_delete_pattern(pattern: str) -> None:
    """Delete all keys matching a glob pattern. No-op if Redis unavailable."""
    r = _get_redis()
    if r is None:
        return
    try:
        keys = r.keys(pattern)
        if keys:
            r.delete(*keys)
    except Exception as exc:
        logger.warning("cache_delete_pattern(%s) failed: %s", pattern, exc)
