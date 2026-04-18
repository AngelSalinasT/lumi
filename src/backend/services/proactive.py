"""Servicio de conversación proactiva — Lumi inicia temas."""

import logging
import random
from datetime import datetime

from config import get_settings
from services.medications import add_pending_notification
from services.mongo import get_user_profile
from services.tts import text_to_speech

logger = logging.getLogger(__name__)
settings = get_settings()

# Temas base organizados por categoría
TOPIC_TEMPLATES = {
    "historia": [
        "Oye {name}, ¿sabías que {fact}? ¡Qué cosa, verdad!",
        "Fíjate {name}, me acordé de algo bien interesante: {fact}.",
    ],
    "musica": [
        "Oye {name}, me acordé de una cosa de {artist}: {fact}.",
        "{name}, ¿tú sabías esto de {artist}? {fact}.",
    ],
    "salud": [
        "Oye {name}, un tip rápido: {fact}. ¡Cuídate mucho!",
    ],
    "general": [
        "{name}, fíjate que {fact}. ¿Tú qué opinas?",
        "Oye {name}, {fact}. ¡Qué interesante, no!",
    ],
}

FACTS = {
    "historia": [
        "México tuvo un emperador que solo duró 45 minutos en el poder, Pedro Lascuráin, el presidente más corto de la historia",
        "la Ciudad de México está construida sobre un lago, por eso se hunde un poquito cada año",
        "el chocolate viene de México, los aztecas lo tomaban con chile y lo llamaban xocolātl",
        "Frida Kahlo y Diego Rivera se casaron dos veces entre ellos, imagínate la novela",
        "el Castillo de Chapultepec es el único castillo real en toda América",
        "los mayas inventaron el concepto del número cero, antes que los europeos",
        "el volcán Paricutín en Michoacán nació en 1943 en la milpa de un campesino, de un día para otro",
    ],
    "futbol": [
        "Hugo Sánchez metió un gol de chilena tan bonito con el Real Madrid que lo repitieron en la tele como mil veces",
        "la selección mexicana ha ido a más mundiales seguidos que casi cualquier país",
        "el estadio Azteca es uno de los dos únicos estadios donde se han jugado dos finales de mundial",
        "Cuauhtémoc Blanco fue tan crack que en Europa le decían el mago mexicano",
    ],
    "musica_boleros": [
        "Agustín Lara nunca fue a España pero compuso Granada, una de las canciones más famosas sobre ese lugar",
        "Pedro Infante grabó más de 300 canciones y filmó más de 60 películas, un verdadero grande",
        "José José podía sostener una nota por más de 20 segundos, por eso le decían el Príncipe de la Canción",
    ],
    "musica_juan_gabriel": [
        "Juan Gabriel escribió más de 1800 canciones, era una máquina de componer",
        "Juan Gabriel llenó el Palacio de Bellas Artes, algo que casi ningún artista popular ha logrado",
        "la primera canción que Juan Gabriel compuso fue a los 13 años, desde chiquito traía el talento",
    ],
    "cocina": [
        "los tacos al pastor vienen de los inmigrantes libaneses que trajeron el shawarma a México",
        "el mole tiene más de 30 ingredientes y cada familia tiene su receta secreta",
        "el chile en nogada se inventó para celebrar la independencia de México, por eso lleva los colores de la bandera",
    ],
    "salud": [
        "caminar aunque sea 15 minutitos al día ayuda mucho al corazón y al ánimo",
        "tomar agua es bien importante, sobre todo en la mañana al despertar",
        "reírse es la mejor medicina, dicen que 15 minutos de risa equivalen a 2 horas de relajación",
    ],
}


def _pick_topic(profile: dict) -> tuple[str, str]:
    """Elige un tema y dato basado en los intereses del usuario."""
    interests = profile.get("interests", {})
    name = profile.get("name", "amigo")

    # Ponderar categorías según gustos
    weighted = []

    fav_team = interests.get("favorite_team", "") or profile.get("favorite_team", "")
    if fav_team:
        weighted.extend(["futbol"] * 3)

    fav_music = interests.get("favorite_music", "") or profile.get("favorite_music", "")
    if "bolero" in fav_music.lower():
        weighted.extend(["musica_boleros"] * 3)
    if "juan gabriel" in fav_music.lower():
        weighted.extend(["musica_juan_gabriel"] * 3)

    topics = interests.get("topics", [])
    if any("historia" in t.lower() for t in topics):
        weighted.extend(["historia"] * 3)
    if any("cocina" in t.lower() for t in topics):
        weighted.extend(["cocina"] * 2)

    weighted.extend(["historia", "cocina", "salud"])

    category = random.choice(weighted)
    fact = random.choice(FACTS.get(category, FACTS["historia"]))

    # Elegir template
    if category.startswith("musica"):
        artist = "Juan Gabriel" if "juan_gabriel" in category else "los boleros"
        templates = TOPIC_TEMPLATES["musica"]
        text = random.choice(templates).format(name=name, artist=artist, fact=fact)
    elif category == "salud":
        text = random.choice(TOPIC_TEMPLATES["salud"]).format(name=name, fact=fact)
    else:
        text = random.choice(TOPIC_TEMPLATES["general"]).format(name=name, fact=fact)

    return category, text


async def generate_proactive_message(device_id: str) -> dict:
    """Genera y encola un mensaje proactivo de Lumi."""
    profile = await get_user_profile(device_id)
    if not profile.get("activated"):
        return {"status": "skipped", "reason": "not activated"}

    category, text = _pick_topic(profile)

    audio = await text_to_speech(text)
    add_pending_notification(device_id, text, audio, f"proactive_{category}")

    logger.info("Proactivo [%s] para %s: %s", category, device_id, text[:80])
    return {"status": "ok", "category": category, "text": text, "audio_bytes": len(audio)}
