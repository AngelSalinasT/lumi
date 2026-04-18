"""Servicio de medicamentos: persistencia y scheduler de recordatorios."""

import asyncio
import logging
from datetime import datetime, timezone

from services.tts import text_to_speech

logger = logging.getLogger(__name__)

# Cola de notificaciones pendientes por device_id
# Formato: {device_id: [{"type": "medication", "text": "...", "audio": bytes, "created_at": "..."}]}
_pending_notifications: dict[str, list[dict]] = {}

# Medicamentos confirmados/no confirmados
# {device_id: [{"name": "...", "time": "HH:MM", "taken": bool, "asked": bool, "date": "YYYY-MM-DD"}]}
_medication_log: dict[str, list[dict]] = {}

_scheduler_task: asyncio.Task | None = None


def get_pending_notifications(device_id: str) -> list[dict]:
    """Obtiene y limpia notificaciones pendientes para un dispositivo."""
    notifications = _pending_notifications.pop(device_id, [])
    return notifications


def add_pending_notification(device_id: str, text: str, audio: bytes, notif_type: str = "medication"):
    """Agrega una notificación pendiente para un dispositivo."""
    if device_id not in _pending_notifications:
        _pending_notifications[device_id] = []
    _pending_notifications[device_id].append({
        "type": notif_type,
        "text": text,
        "audio": audio,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    logger.info("Notificación pendiente para %s: %s", device_id, text[:60])


async def _generate_reminder_audio(user_name: str, med_name: str, dose: str) -> tuple[str, bytes]:
    """Genera texto y audio para un recordatorio de medicamento."""
    text = f"¡{user_name}! Es hora de tu {med_name}"
    if dose:
        text += f", {dose}"
    text += ". No se te olvide, es importante para tu salud."

    audio = await text_to_speech(text)
    return text, audio


async def _generate_followup_audio(user_name: str, med_name: str) -> tuple[str, bytes]:
    """Genera texto y audio para preguntar si tomó el medicamento."""
    text = f"Oye {user_name}, ¿ya te tomaste tu {med_name}?"
    audio = await text_to_speech(text)
    return text, audio


async def _check_medications():
    """Revisa medicamentos pendientes y genera recordatorios."""
    from services.mongo import get_all_users_with_medications

    now = datetime.now()
    current_time = now.strftime("%H:%M")
    today = now.strftime("%Y-%m-%d")

    users = await get_all_users_with_medications()

    for user in users:
        device_id = user.get("_id", "default_device")
        user_name = user.get("name", "amigo")
        medications = user.get("medications", [])

        for med in medications:
            med_time = med.get("time", "")
            med_name = med.get("name", "medicina")
            med_dose = med.get("dose", "")

            if not med_time:
                continue

            # Verificar si ya se envió hoy
            log_key = f"{device_id}:{med_name}:{today}"
            already_sent = any(
                entry.get("key") == log_key
                for entry in _medication_log.get(device_id, [])
            )

            if current_time == med_time and not already_sent:
                logger.info("Recordatorio: %s para %s (%s)", med_name, user_name, device_id)
                try:
                    text, audio = await _generate_reminder_audio(user_name, med_name, med_dose)
                    add_pending_notification(device_id, text, audio, "medication_reminder")

                    # Registrar en log
                    if device_id not in _medication_log:
                        _medication_log[device_id] = []
                    _medication_log[device_id].append({
                        "key": log_key,
                        "name": med_name,
                        "time": med_time,
                        "date": today,
                        "reminded_at": now.isoformat(),
                        "taken": None,  # None = no se ha preguntado, True/False después
                    })

                    # Programar follow-up en 5 minutos
                    asyncio.create_task(_schedule_followup(device_id, user_name, med_name, log_key))
                except Exception as e:
                    logger.error("Error generando recordatorio: %s", e)


async def _schedule_followup(device_id: str, user_name: str, med_name: str, log_key: str):
    """Espera 5 minutos y pregunta si tomó el medicamento."""
    await asyncio.sleep(300)  # 5 minutos

    # Verificar si ya confirmó (podría haberlo dicho en conversación)
    log_entries = _medication_log.get(device_id, [])
    for entry in log_entries:
        if entry.get("key") == log_key and entry.get("taken") is not None:
            return  # Ya se confirmó

    try:
        text, audio = await _generate_followup_audio(user_name, med_name)
        add_pending_notification(device_id, text, audio, "medication_followup")
    except Exception as e:
        logger.error("Error generando followup: %s", e)


def mark_medication_taken(device_id: str, med_name: str, taken: bool = True):
    """Marca un medicamento como tomado o no tomado."""
    today = datetime.now().strftime("%Y-%m-%d")
    for entry in _medication_log.get(device_id, []):
        if entry.get("name", "").lower() == med_name.lower() and entry.get("date") == today:
            entry["taken"] = taken
            logger.info("Medicamento %s marcado como %s para %s", med_name, "tomado" if taken else "no tomado", device_id)
            return True
    return False


def get_medication_log(device_id: str, days: int = 7) -> list[dict]:
    """Obtiene el log de medicamentos de los últimos N días."""
    return _medication_log.get(device_id, [])[-days * 10:]  # aprox


async def _scheduler_loop():
    """Loop principal del scheduler — revisa cada 30 segundos."""
    logger.info("Medication scheduler iniciado")
    while True:
        try:
            await _check_medications()
        except Exception as e:
            logger.error("Error en scheduler: %s", e)
        await asyncio.sleep(30)


def start_scheduler():
    """Inicia el scheduler de medicamentos como tarea de fondo."""
    global _scheduler_task
    if _scheduler_task is None or _scheduler_task.done():
        _scheduler_task = asyncio.create_task(_scheduler_loop())
        logger.info("Scheduler de medicamentos iniciado")


def stop_scheduler():
    """Detiene el scheduler."""
    global _scheduler_task
    if _scheduler_task and not _scheduler_task.done():
        _scheduler_task.cancel()
        logger.info("Scheduler de medicamentos detenido")
