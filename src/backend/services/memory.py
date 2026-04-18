"""Memoria de conversación con Redis (caché) + MongoDB (persistencia).

Patrón:
- Redis es la fuente rápida (read/write cada turno)
- MongoDB es la fuente de verdad (persistencia)
- Si Redis no tiene datos → carga de MongoDB → cachea en Redis
- TTL de 1 hora: si no hay actividad, Redis se limpia solo
- Cada turno nuevo → push a Redis + save a MongoDB
"""

import json
import logging
from datetime import datetime, timezone

import redis.asyncio as redis

from services.mongo import get_conversation_history, save_conversation_turn

logger = logging.getLogger(__name__)

HISTORY_TTL = 3600  # 1 hora
MAX_TURNS = 20  # Últimos 20 turnos en memoria

_redis: redis.Redis | None = None


async def init_memory(redis_url: str = "redis://localhost:6379"):
    """Conecta a Redis."""
    global _redis
    try:
        _redis = redis.from_url(redis_url, decode_responses=True)
        await _redis.ping()
        logger.info("Redis conectado: %s", redis_url)
    except Exception as e:
        logger.warning("Redis no disponible: %s — usando solo MongoDB", e)
        _redis = None


async def close_memory():
    """Cierra conexión a Redis."""
    if _redis:
        await _redis.aclose()
        logger.info("Redis cerrado")


def _key(device_id: str) -> str:
    return f"lumi:history:{device_id}"


async def get_history(device_id: str) -> list[dict]:
    """Obtiene historial de conversación.

    1. Intenta Redis (rápido)
    2. Si no hay → carga de MongoDB → cachea en Redis
    """
    # Intentar Redis primero
    if _redis:
        try:
            raw = await _redis.lrange(_key(device_id), 0, -1)
            if raw:
                turns = [json.loads(r) for r in raw]
                logger.debug("Historial desde Redis: %d turnos", len(turns))
                return turns[-MAX_TURNS:]
        except Exception as e:
            logger.warning("Error leyendo Redis: %s", e)

    # Fallback: cargar de MongoDB
    turns = await get_conversation_history(device_id, limit=MAX_TURNS)

    # Cachear en Redis para la próxima
    if _redis and turns:
        try:
            key = _key(device_id)
            pipe = _redis.pipeline()
            await pipe.delete(key)
            for turn in turns:
                await pipe.rpush(key, json.dumps(turn, ensure_ascii=False))
            await pipe.expire(key, HISTORY_TTL)
            await pipe.execute()
            logger.debug("Historial cacheado en Redis: %d turnos", len(turns))
        except Exception as e:
            logger.warning("Error cacheando en Redis: %s", e)

    return turns


async def add_turn(device_id: str, user_text: str, assistant_text: str):
    """Agrega un turno a Redis + MongoDB.

    Redis: push inmediato + trim a MAX_TURNS + reset TTL
    MongoDB: persistencia (async, no bloqueante)
    """
    now = datetime.now(timezone.utc).isoformat()
    user_turn = {"role": "user", "content": user_text, "timestamp": now}
    assistant_turn = {"role": "assistant", "content": assistant_text, "timestamp": now}

    # Push a Redis
    if _redis:
        try:
            key = _key(device_id)
            pipe = _redis.pipeline()
            await pipe.rpush(key, json.dumps(user_turn, ensure_ascii=False))
            await pipe.rpush(key, json.dumps(assistant_turn, ensure_ascii=False))
            # Mantener solo los últimos MAX_TURNS * 2 entries (user + assistant)
            await pipe.ltrim(key, -(MAX_TURNS * 2), -1)
            await pipe.expire(key, HISTORY_TTL)
            await pipe.execute()
        except Exception as e:
            logger.warning("Error escribiendo a Redis: %s", e)

    # Persistir en MongoDB
    await save_conversation_turn(device_id, user_text, assistant_text)
