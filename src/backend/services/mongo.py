import logging
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorClient

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_client: AsyncIOMotorClient | None = None
_db = None

# Fallback en memoria cuando Mongo no está disponible
_local_users: dict[str, dict] = {}
_local_conversations: dict[str, list[dict]] = {}


async def init_mongo():
    global _client, _db
    if not settings.mongodb_uri:
        logger.warning("MONGODB_URI no configurada — mongo deshabilitado")
        return
    try:
        _client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
        await _client.admin.command("ping")
        _db = _client[settings.mongodb_database]
        logger.info("MongoDB conectado a %s", settings.mongodb_database)
    except Exception as e:
        logger.warning("MongoDB no disponible: %s — usando memoria local", e)
        _client = None
        _db = None


async def close_mongo():
    global _client
    if _client:
        _client.close()
        logger.info("MongoDB cerrado")


def get_db():
    return _db


# --- Perfil de usuario ---
# Esquema flexible (MongoDB es schema-less):
# {
#   "_id": "device_id",
#   "name": "Don Ernesto",
#   "age": 78,
#   "onboarding_done": true,
#   "interests": {
#     "sports": {"favorite_team": "Cruz Azul", "sport": "fútbol"},
#     "music": ["boleros", "Juan Gabriel"],
#     "topics": ["historia de México", "cocina", "noticias"],
#     "hobbies": ["jardinería", "dominó"]
#   },
#   "medications": [
#     {"name": "Metformina", "dose": "500mg", "time": "08:00"}
#   ],
#   "family_contacts": [
#     {"name": "María", "relation": "hija", "phone": "+52...", "telegram_id": "..."}
#   ],
#   "personality_notes": ["le gusta que le cuenten chistes", "es muy platicador"]
# }

async def get_user_profile(device_id: str) -> dict:
    if _db is None:
        return _local_users.get(device_id, {"name": "amigo"})
    doc = await _db.users.find_one({"_id": device_id})
    return doc or {"_id": device_id, "name": "amigo"}


async def save_user_profile(device_id: str, profile: dict) -> None:
    if _db is None:
        _local_users[device_id] = profile
        return
    profile["_id"] = device_id
    await _db.users.replace_one({"_id": device_id}, profile, upsert=True)


async def update_user_field(device_id: str, field: str, value) -> None:
    """Actualiza un campo específico del perfil sin sobreescribir todo."""
    if _db is None:
        if device_id not in _local_users:
            _local_users[device_id] = {"name": "amigo"}
        _local_users[device_id][field] = value
        return
    await _db.users.update_one(
        {"_id": device_id},
        {"$set": {field: value}},
        upsert=True,
    )


# --- Historial de conversación ---

async def get_conversation_history(device_id: str, limit: int = 20) -> list[dict]:
    if _db is None:
        return _local_conversations.get(device_id, [])[-limit:]
    doc = await _db.conversations.find_one(
        {"device_id": device_id},
        sort=[("timestamp", -1)],
    )
    if not doc:
        return []
    return doc.get("turns", [])[-limit:]


async def save_conversation_turn(
    device_id: str, user_text: str, assistant_text: str
) -> None:
    if _db is None:
        if device_id not in _local_conversations:
            _local_conversations[device_id] = []
        now = datetime.now(timezone.utc).isoformat()
        _local_conversations[device_id].append(
            {"role": "user", "content": user_text, "timestamp": now}
        )
        _local_conversations[device_id].append(
            {"role": "assistant", "content": assistant_text, "timestamp": now}
        )
        return
    now = datetime.now(timezone.utc).isoformat()
    await _db.conversations.update_one(
        {"device_id": device_id},
        {
            "$push": {
                "turns": {
                    "$each": [
                        {"role": "user", "content": user_text, "timestamp": now},
                        {"role": "assistant", "content": assistant_text, "timestamp": now},
                    ]
                }
            },
            "$set": {"timestamp": now},
            "$setOnInsert": {"device_id": device_id},
        },
        upsert=True,
    )


async def add_medication(device_id: str, name: str, dose: str = "", time: str = "") -> None:
    """Agrega un medicamento al perfil del usuario."""
    med = {"name": name, "dose": dose, "time": time}
    if _db is None:
        if device_id not in _local_users:
            _local_users[device_id] = {"name": "amigo"}
        meds = _local_users[device_id].setdefault("medications", [])
        # Evitar duplicados por nombre
        meds[:] = [m for m in meds if m["name"].lower() != name.lower()]
        meds.append(med)
        return
    await _db.users.update_one(
        {"_id": device_id},
        {
            "$pull": {"medications": {"name": {"$regex": f"^{name}$", "$options": "i"}}},
        },
    )
    await _db.users.update_one(
        {"_id": device_id},
        {"$push": {"medications": med}},
        upsert=True,
    )


async def remove_medication(device_id: str, name: str) -> None:
    """Elimina un medicamento del perfil."""
    if _db is None:
        if device_id in _local_users:
            meds = _local_users[device_id].get("medications", [])
            meds[:] = [m for m in meds if m["name"].lower() != name.lower()]
        return
    await _db.users.update_one(
        {"_id": device_id},
        {"$pull": {"medications": {"name": {"$regex": f"^{name}$", "$options": "i"}}}},
    )


async def get_medications(device_id: str) -> list[dict]:
    """Obtiene los medicamentos de un usuario."""
    if _db is None:
        return _local_users.get(device_id, {}).get("medications", [])
    doc = await _db.users.find_one({"_id": device_id})
    return (doc or {}).get("medications", [])


async def get_all_users_with_medications() -> list[dict]:
    """Obtiene todos los usuarios que tienen medicamentos configurados."""
    if _db is None:
        return [
            {"_id": did, **data}
            for did, data in _local_users.items()
            if data.get("medications")
        ]
    cursor = _db.users.find({"medications": {"$exists": True, "$ne": []}})
    return await cursor.to_list(length=100)


async def save_family_contact(device_id: str, name: str, relation: str, phone: str = "", telegram_id: str = "") -> None:
    """Guarda un contacto familiar."""
    contact = {"name": name, "relation": relation, "phone": phone, "telegram_id": telegram_id}
    if _db is None:
        if device_id not in _local_users:
            _local_users[device_id] = {"name": "amigo"}
        contacts = _local_users[device_id].setdefault("family_contacts", [])
        contacts[:] = [c for c in contacts if c["name"].lower() != name.lower()]
        contacts.append(contact)
        return
    await _db.users.update_one(
        {"_id": device_id},
        {
            "$pull": {"family_contacts": {"name": {"$regex": f"^{name}$", "$options": "i"}}},
        },
    )
    await _db.users.update_one(
        {"_id": device_id},
        {"$push": {"family_contacts": contact}},
        upsert=True,
    )


async def save_alert(device_id: str, reason: str, user_name: str) -> None:
    """Guarda una alerta de emergencia."""
    alert = {
        "device_id": device_id,
        "reason": reason,
        "user_name": user_name,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "seen": False,
    }
    if _db is None:
        if device_id not in _local_conversations:
            _local_conversations[device_id] = []
        _local_conversations.setdefault("_alerts", []).append(alert)
        return
    await _db.alerts.insert_one(alert)


async def get_alerts(device_id: str, limit: int = 20) -> list[dict]:
    """Obtiene las alertas de emergencia."""
    if _db is None:
        return [a for a in _local_conversations.get("_alerts", []) if a["device_id"] == device_id][-limit:]
    cursor = _db.alerts.find({"device_id": device_id}).sort("timestamp", -1).limit(limit)
    alerts = await cursor.to_list(length=limit)
    for a in alerts:
        a.pop("_id", None)
    alerts.reverse()
    return alerts


async def mark_alerts_seen(device_id: str) -> None:
    """Marca todas las alertas como vistas."""
    if _db is None:
        for a in _local_conversations.get("_alerts", []):
            if a["device_id"] == device_id:
                a["seen"] = True
        return
    await _db.alerts.update_many({"device_id": device_id, "seen": False}, {"$set": {"seen": True}})


async def delete_alert(device_id: str, timestamp: str) -> None:
    """Elimina una alerta específica por timestamp."""
    if _db is None:
        alerts = _local_conversations.get("_alerts", [])
        alerts[:] = [a for a in alerts if not (a["device_id"] == device_id and a["timestamp"] == timestamp)]
        return
    await _db.alerts.delete_one({"device_id": device_id, "timestamp": timestamp})


async def delete_all_alerts(device_id: str) -> None:
    """Elimina todas las alertas de un dispositivo."""
    if _db is None:
        alerts = _local_conversations.get("_alerts", [])
        alerts[:] = [a for a in alerts if a["device_id"] != device_id]
        return
    await _db.alerts.delete_many({"device_id": device_id})


async def count_unseen_alerts(device_id: str) -> int:
    """Cuenta alertas no vistas."""
    if _db is None:
        return sum(1 for a in _local_conversations.get("_alerts", []) if a["device_id"] == device_id and not a["seen"])
    return await _db.alerts.count_documents({"device_id": device_id, "seen": False})


async def get_activity_summary(device_id: str) -> dict:
    """Obtiene un resumen de actividad para la app familiar."""
    profile = await get_user_profile(device_id)
    history = await get_conversation_history(device_id, limit=50)

    last_interaction = history[-1]["timestamp"] if history else None
    total_today = sum(
        1 for t in history
        if t.get("timestamp", "").startswith(datetime.now(timezone.utc).strftime("%Y-%m-%d"))
        and t["role"] == "user"
    )

    return {
        "device_id": device_id,
        "user_name": profile.get("name", "amigo"),
        "last_interaction": last_interaction,
        "interactions_today": total_today,
        "medications": profile.get("medications", []),
        "family_contacts": profile.get("family_contacts", []),
    }
