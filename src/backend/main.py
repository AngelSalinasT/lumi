import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

from config import get_settings
from graph.builder import companion_graph
from services.alerts import send_emergency_alert
from services.medications import (
    get_medication_log,
    get_pending_notifications,
    start_scheduler,
    stop_scheduler,
)
from services.memory import add_turn, close_memory, get_history, init_memory
from services.mongo import (
    add_medication,
    close_mongo,
    get_activity_summary,
    count_unseen_alerts,
    get_alerts,
    get_conversation_history,
    get_medications,
    get_user_profile,
    init_mongo,
    mark_alerts_seen,
    remove_medication,
    save_family_contact,
)
from services.stt import speech_to_text

logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.basicConfig(
        level=logging.DEBUG if settings.debug else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    logger.info("Companion AI backend iniciando...")
    await init_mongo()
    await init_memory()
    start_scheduler()
    yield
    logger.info("Cerrando conexiones...")
    stop_scheduler()
    await close_memory()
    await close_mongo()


app = FastAPI(
    title="Companion AI",
    description="Backend para agente conversacional de adultos mayores",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────
# Endpoints del dispositivo (ESP32 / M5GO)
# ──────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/chat")
async def chat(
    audio: UploadFile = File(...),
    device_id: str = Form(default="default_device"),
):
    """Flujo principal: recibe WAV, devuelve audio."""
    audio_bytes = await audio.read()
    logger.info("Recibido audio: %d bytes, device: %s", len(audio_bytes), device_id)

    transcription = await speech_to_text(audio_bytes)
    logger.info("Transcripción: %s", transcription)

    user_profile = await get_user_profile(device_id)
    conversation_history = await get_history(device_id)

    try:
        result = await companion_graph.ainvoke(
            {
                "device_id": device_id,
                "transcription": transcription,
                "user_profile": user_profile,
                "conversation_history": conversation_history,
                "messages": [],
                "response_text": None,
                "audio_response": None,
                "tools_used": [],
            },
            {"recursion_limit": 8},
        )
    except Exception as e:
        logger.error("Error en grafo: %s", e)
        from services.tts import text_to_speech
        fallback_text = "Disculpa, no te escuché bien. ¿Puedes repetirlo?"
        audio_response = await text_to_speech(fallback_text)
        await add_turn(device_id, transcription, fallback_text)
        return Response(content=audio_response, media_type="audio/basic")

    response_text = result.get("response_text", "")
    audio_response = result.get("audio_response", b"")

    await add_turn(device_id, transcription, response_text)

    logger.info("Respuesta: %s (%d bytes audio)", response_text[:80], len(audio_response))
    return Response(content=audio_response, media_type="audio/basic")


@app.post("/chat/text")
async def chat_text(
    text: str = Form(...),
    device_id: str = Form(default="default_device"),
):
    """Endpoint de prueba: recibe texto, devuelve audio."""
    user_profile = await get_user_profile(device_id)
    conversation_history = await get_conversation_history(device_id)

    result = await companion_graph.ainvoke({
        "device_id": device_id,
        "transcription": text,
        "user_profile": user_profile,
        "conversation_history": conversation_history,
        "messages": [],
        "response_text": None,
        "audio_response": None,
        "intent": None,
        "trigger_alert": False,
    })

    response_text = result.get("response_text", "")
    audio_response = result.get("audio_response", b"")

    await add_turn(device_id, text, response_text)

    return Response(content=audio_response, media_type="audio/basic")


class DebugChatInput(BaseModel):
    text: str
    device_id: str = "m5go_001"


@app.post("/chat/debug")
async def chat_debug(data: DebugChatInput):
    """Endpoint de prueba: texto → texto + tools usadas (sin TTS)."""
    user_profile = await get_user_profile(data.device_id)
    conversation_history = await get_conversation_history(data.device_id)

    # Invocar grafo sin TTS
    from graph.builder import companion_graph as graph
    result = await graph.ainvoke({
        "device_id": data.device_id,
        "transcription": data.text,
        "user_profile": user_profile,
        "conversation_history": conversation_history,
        "messages": [],
        "response_text": None,
        "audio_response": None,
        "tools_used": [],
    }, {"recursion_limit": 8})

    response_text = result.get("response_text", "")
    tools_used = result.get("tools_used", [])

    await add_turn(data.device_id, data.text, response_text)

    return {
        "user": data.text,
        "lumi": response_text,
        "tools_used": tools_used,
        "onboarding_status": "app_configurado" if user_profile.get("onboarding_done") and not conversation_history else "completado",
    }


@app.post("/emergency")
async def emergency(
    device_id: str = Form(default="default_device"),
    reason: str = Form(default="boton"),
):
    """Alerta de emergencia desde el M5GO."""
    user_profile = await get_user_profile(device_id)
    user_name = user_profile.get("name", "Usuario")

    reasons = {
        "boton": "Botón de emergencia presionado",
        "caida": "Posible caída detectada por acelerómetro",
    }
    reason_text = reasons.get(reason, reason)

    await send_emergency_alert(
        device_id=device_id,
        reason=reason_text,
        user_name=user_name,
    )

    # Push notification a la app familiar
    await send_push_notification(
        device_id,
        f"🚨 Emergencia — {user_name}",
        reason_text,
    )

    return {"status": "alert_sent", "user": user_name}


@app.get("/notifications/{device_id}")
async def get_notifications(device_id: str):
    """Polling del ESP32: obtiene notificaciones pendientes (recordatorios, etc.).
    Devuelve audio si hay notificación, 204 si no hay nada."""
    notifications = get_pending_notifications(device_id)
    if not notifications:
        return Response(status_code=204)

    # Devolver la primera notificación (audio)
    notif = notifications[0]
    # Si hay más, se quedarán para el siguiente poll
    if len(notifications) > 1:
        from services.medications import _pending_notifications
        _pending_notifications[device_id] = notifications[1:]

    return Response(
        content=notif["audio"],
        media_type="audio/basic",
        headers={
            "X-Notification-Type": notif["type"],
            "X-Notification-Text": notif["text"][:200],
        },
    )


# ──────────────────────────────────────────────
# API para la app familiar (Expo)
# ──────────────────────────────────────────────

@app.get("/api/profile/{device_id}")
async def api_get_profile(device_id: str):
    """Obtiene el perfil completo del usuario."""
    profile = await get_user_profile(device_id)
    profile.pop("_id", None)
    return {"device_id": device_id, **profile}


@app.get("/api/activity/{device_id}")
async def api_get_activity(device_id: str):
    """Resumen de actividad para la app familiar."""
    summary = await get_activity_summary(device_id)
    summary["unseen_alerts"] = await count_unseen_alerts(device_id)
    return summary


@app.get("/api/alerts/{device_id}")
async def api_get_alerts(device_id: str):
    """Obtiene alertas de emergencia."""
    alerts = await get_alerts(device_id)
    unseen = await count_unseen_alerts(device_id)
    return {"device_id": device_id, "alerts": alerts, "unseen": unseen}


@app.post("/api/alerts/{device_id}/seen")
async def api_mark_alerts_seen(device_id: str):
    """Marca todas las alertas como vistas."""
    await mark_alerts_seen(device_id)
    return {"status": "ok"}


@app.delete("/api/alerts/{device_id}/{alert_timestamp}")
async def api_delete_alert(device_id: str, alert_timestamp: str):
    """Elimina una alerta específica."""
    from services.mongo import delete_alert
    await delete_alert(device_id, alert_timestamp)
    return {"status": "ok"}


@app.delete("/api/alerts/{device_id}")
async def api_delete_all_alerts(device_id: str):
    """Elimina todas las alertas de un dispositivo."""
    from services.mongo import delete_all_alerts
    await delete_all_alerts(device_id)
    return {"status": "ok"}


@app.get("/api/conversations/{device_id}")
async def api_get_conversations(device_id: str, limit: int = 50):
    """Historial de conversaciones."""
    history = await get_conversation_history(device_id, limit=limit)
    return {"device_id": device_id, "conversations": history}


@app.get("/api/medications/{device_id}")
async def api_get_medications(device_id: str):
    """Lista de medicamentos configurados."""
    meds = await get_medications(device_id)
    return {"device_id": device_id, "medications": meds}


class MedicationInput(BaseModel):
    name: str
    dose: str = ""
    time: str = ""


@app.post("/api/medications/{device_id}")
async def api_add_medication(device_id: str, med: MedicationInput):
    """Agrega o actualiza un medicamento desde la app."""
    await add_medication(device_id, med.name, med.dose, med.time)
    return {"status": "ok", "medication": med.model_dump()}


@app.delete("/api/medications/{device_id}/{med_name}")
async def api_remove_medication(device_id: str, med_name: str):
    """Elimina un medicamento."""
    await remove_medication(device_id, med_name)
    return {"status": "ok"}


@app.get("/api/medication-log/{device_id}")
async def api_medication_log(device_id: str):
    """Log de medicamentos tomados/no tomados."""
    log = get_medication_log(device_id)
    return {"device_id": device_id, "log": log}


class OnboardingInput(BaseModel):
    name: str
    age: int | None = None
    medications: list[MedicationInput] = []
    family_contacts: list["FamilyContactInput"] = []
    health_conditions: list[str] = []


@app.post("/api/onboarding/{device_id}")
async def api_complete_onboarding(device_id: str, data: OnboardingInput):
    """Guarda todos los datos del onboarding desde la app y marca como completado."""
    from services.mongo import update_user_field

    await update_user_field(device_id, "name", data.name)
    await update_user_field(device_id, "onboarding_done", True)
    if data.age:
        await update_user_field(device_id, "age", data.age)
    if data.health_conditions:
        await update_user_field(device_id, "health_conditions", data.health_conditions)

    for med in data.medications:
        await add_medication(device_id, med.name, med.dose, med.time)

    for contact in data.family_contacts:
        await save_family_contact(device_id, contact.name, contact.relation, contact.phone, contact.telegram_id)

    logger.info("Onboarding completado para %s: %s", device_id, data.name)
    return {"status": "ok", "onboarding_done": True}


class FamilyContactInput(BaseModel):
    name: str
    relation: str
    phone: str = ""
    telegram_id: str = ""


@app.post("/api/family/{device_id}")
async def api_add_family_contact(device_id: str, contact: FamilyContactInput):
    """Agrega un contacto familiar desde la app."""
    await save_family_contact(device_id, contact.name, contact.relation, contact.phone, contact.telegram_id)
    return {"status": "ok", "contact": contact.model_dump()}


# --- Estado del dispositivo (pairing / setup) ---

# Estados posibles: "waiting_setup" | "onboarding" | "ready"
_device_status: dict[str, str] = {}


@app.get("/api/device/{device_id}/status")
async def api_device_status(device_id: str):
    """El M5GO hace polling aquí para saber si ya puede arrancar."""
    status = _device_status.get(device_id, "waiting_setup")
    profile = await get_user_profile(device_id)
    onboarding_done = profile.get("onboarding_done", False)
    activated = profile.get("activated", False)
    return {
        "device_id": device_id,
        "status": "ready" if activated else ("onboarding" if onboarding_done else status),
        "onboarding_done": onboarding_done,
        "activated": activated,
        "user_name": profile.get("name", "amigo"),
    }


@app.post("/api/device/{device_id}/pair")
async def api_pair_device(device_id: str):
    """La app escanea el QR y llama aquí para iniciar el pairing."""
    _device_status[device_id] = "onboarding"
    logger.info("Dispositivo %s pareado — iniciando onboarding", device_id)
    return {"status": "ok", "device_id": device_id}


@app.post("/api/device/{device_id}/activate")
async def api_activate_device(device_id: str):
    """La app confirma que Lumi puede empezar a conversar."""
    from services.mongo import update_user_field
    await update_user_field(device_id, "activated", True)
    _device_status[device_id] = "ready"
    logger.info("Dispositivo %s activado — Lumi puede conversar", device_id)
    return {"status": "ok", "activated": True}


# --- Push tokens ---

_push_tokens: dict[str, str] = {}  # device_id -> expo push token


class PushTokenInput(BaseModel):
    device_id: str
    push_token: str


@app.post("/api/push-token")
async def api_register_push_token(data: PushTokenInput):
    """Registra un Expo push token para un dispositivo."""
    _push_tokens[data.device_id] = data.push_token
    logger.info("Push token registrado para %s: %s", data.device_id, data.push_token[:20])
    return {"status": "ok"}


async def send_push_notification(device_id: str, title: str, body: str):
    """Envía push notification via Expo Push Service."""
    token = _push_tokens.get(device_id)
    if not token:
        logger.warning("No hay push token para %s", device_id)
        return

    import httpx
    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                "https://exp.host/--/api/v2/push/send",
                json={
                    "to": token,
                    "title": title,
                    "body": body,
                    "sound": "default",
                    "priority": "high",
                    "badge": 1,
                },
                timeout=10,
            )
            logger.info("Push enviada a %s: %s", device_id, r.status_code)
    except Exception as e:
        logger.error("Error enviando push: %s", e)


@app.post("/debug/trigger-reminder/{device_id}")
async def debug_trigger_reminder(device_id: str, med_name: str = "Metformina"):
    """DEBUG: Fuerza un recordatorio de medicamento."""
    from services.medications import add_pending_notification
    profile = await get_user_profile(device_id)
    user_name = profile.get("name", "amigo")
    meds = profile.get("medications", [])
    med = next((m for m in meds if m["name"].lower() == med_name.lower()), None)
    dose = med.get("dose", "") if med else ""

    text = f"¡{user_name}! Es hora de tu {med_name}"
    if dose:
        text += f", {dose}"
    text += ". No se te olvide, es importante para tu salud."

    from services.tts import text_to_speech
    audio = await text_to_speech(text)
    add_pending_notification(device_id, text, audio, "medication_reminder")
    return {"status": "ok", "text": text, "audio_bytes": len(audio)}


@app.post("/debug/trigger-proactive/{device_id}")
async def debug_trigger_proactive(device_id: str):
    """DEBUG: Fuerza una conversación proactiva de Lumi."""
    from services.proactive import generate_proactive_message
    result = await generate_proactive_message(device_id)
    return result


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.backend_host,
        port=settings.backend_port,
        reload=settings.debug,
    )
