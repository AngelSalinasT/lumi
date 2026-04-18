import logging
from datetime import datetime

from langchain_core.tools import tool

logger = logging.getLogger(__name__)


@tool
def get_time() -> str:
    """Obtiene la hora actual. Úsala cuando el usuario pregunte qué hora es."""
    now = datetime.now()
    return now.strftime("Son las %H:%M del %d de %B de %Y")


@tool
def medication_reminder(medication_name: str, dose: str, time: str) -> str:
    """Registra un medicamento con su horario de toma.
    Usa esto cuando el usuario mencione un medicamento que toma, su dosis o su horario.
    Args:
        medication_name: Nombre del medicamento (ej: Metformina, Losartán)
        dose: Dosis del medicamento (ej: 500mg, 1 pastilla). Si no la dice, pon "".
        time: Hora de toma en formato HH:MM (ej: 08:00, 14:30). Si no la dice, pon "".
    """
    logger.info("Medicamento registrado: %s %s a las %s", medication_name, dose, time)
    return f"Medicamento registrado: {medication_name} {dose} a las {time}. Lumi le recordará cuando sea la hora."


@tool
def send_alert(reason: str) -> str:
    """Envía una alerta de emergencia al familiar registrado.
    Usa esto si el usuario dice que se siente muy mal, se cayó, o pide ayuda urgente.
    Args:
        reason: Razón de la alerta (caída, emergencia médica, se siente muy mal, etc.)
    """
    logger.info("ALERTA enviada: %s", reason)
    return f"Alerta enviada al familiar: {reason}"


@tool
def save_user_info(field: str, value: str) -> str:
    """Guarda información personal del usuario que te comparte durante la conversación.
    Usa esto cuando el usuario te diga su nombre, edad, gustos, equipo favorito, etc.
    Args:
        field: Qué dato guardar (name, age, favorite_team, favorite_music, hobby, interest)
        value: El valor a guardar
    """
    logger.info("Guardando info: %s = %s", field, value)
    return f"Guardado: {field} = {value}"


@tool
def save_family_contact(name: str, relation: str, phone: str) -> str:
    """Guarda la información de un familiar del usuario.
    Usa esto cuando el usuario mencione a un familiar con datos de contacto.
    Args:
        name: Nombre del familiar (ej: María, Carlos)
        relation: Relación con el usuario (ej: hija, hijo, nieto, vecina)
        phone: Teléfono del familiar. Si no lo da, pon "".
    """
    logger.info("Contacto familiar: %s (%s) - %s", name, relation, phone)
    return f"Contacto guardado: {name} ({relation})"


@tool
def confirm_medication(medication_name: str, taken: bool) -> str:
    """Registra si el usuario tomó o no su medicamento.
    Usa esto cuando el usuario confirme o niegue haber tomado una medicina.
    Args:
        medication_name: Nombre del medicamento
        taken: True si lo tomó, False si no lo tomó
    """
    status = "tomado" if taken else "no tomado"
    logger.info("Medicamento %s: %s", medication_name, status)
    return f"Registrado: {medication_name} {status}"


companion_tools = [
    get_time,
    medication_reminder,
    send_alert,
    save_user_info,
    save_family_contact,
    confirm_medication,
]

# Mapa de tools por nombre para ejecución directa (patrón agentcode-med)
TOOLS_BY_NAME = {t.name: t for t in companion_tools}
