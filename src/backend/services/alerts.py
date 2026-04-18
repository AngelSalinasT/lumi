import logging
from datetime import datetime

import httpx

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

TELEGRAM_API = f"https://api.telegram.org/bot{settings.telegram_bot_token}"


async def send_telegram_message(chat_id: str, text: str) -> bool:
    """Envía un mensaje por Telegram."""
    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{TELEGRAM_API}/sendMessage",
                json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"},
                timeout=10,
            )
            if r.status_code == 200:
                logger.info("Telegram enviado a %s", chat_id)
                return True
            else:
                logger.error("Telegram error: %s", r.text)
                return False
    except Exception as e:
        logger.error("Telegram fallo: %s", e)
        return False


async def send_emergency_alert(
    device_id: str,
    reason: str,
    user_name: str = "Usuario",
) -> bool:
    """Envía alerta de emergencia a familiares por Telegram."""
    now = datetime.now().strftime("%H:%M del %d/%m/%Y")

    message = (
        f"🚨 <b>ALERTA DE EMERGENCIA — Lumi</b>\n\n"
        f"👤 <b>Usuario:</b> {user_name}\n"
        f"📍 <b>Dispositivo:</b> {device_id}\n"
        f"⚠️ <b>Razón:</b> {reason}\n"
        f"🕐 <b>Hora:</b> {now}\n\n"
        f"Por favor verifique que {user_name} se encuentre bien."
    )

    logger.warning("ALERTA: %s — %s — %s", user_name, reason, now)

    # Guardar en MongoDB para la app
    from services.mongo import save_alert
    try:
        await save_alert(device_id, reason, user_name)
    except Exception as e:
        logger.error("Error guardando alerta en MongoDB: %s", e)

    # Enviar a todos los chat_ids configurados
    sent = False
    for chat_id in settings.telegram_alert_chat_ids:
        if await send_telegram_message(chat_id, message):
            sent = True

    # Si no hay chat_ids configurados, enviar al default
    if not settings.telegram_alert_chat_ids and settings.telegram_default_chat_id:
        sent = await send_telegram_message(settings.telegram_default_chat_id, message)

    return sent
