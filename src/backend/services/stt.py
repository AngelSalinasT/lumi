import logging
from base64 import b64encode

from google import genai
from google.genai import types

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_client = genai.Client(api_key=settings.gemini_api_key)


async def speech_to_text(audio_bytes: bytes) -> str:
    """Convierte audio WAV a texto usando Gemini."""
    response = await _client.aio.models.generate_content(
        model=settings.gemini_model,
        contents=[
            types.Content(
                parts=[
                    types.Part(text=(
                        "Transcribe el siguiente audio en español. "
                        "Devuelve SOLO el texto transcrito, sin explicaciones ni formato adicional."
                    )),
                    types.Part(
                        inline_data=types.Blob(
                            mime_type="audio/wav",
                            data=audio_bytes,
                        )
                    ),
                ]
            )
        ],
    )

    text = response.text.strip()
    logger.info("STT transcripción: %s", text[:100])
    return text
