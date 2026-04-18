import logging

from elevenlabs import AsyncElevenLabs

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def text_to_speech(text: str) -> bytes:
    """Convierte texto a audio ulaw 8kHz usando ElevenLabs."""
    client = AsyncElevenLabs(api_key=settings.elevenlabs_api_key)

    audio_stream = client.text_to_speech.convert(
        voice_id=settings.elevenlabs_voice_id,
        text=text,
        model_id="eleven_multilingual_v2",
        output_format="ulaw_8000",
    )

    chunks = []
    async for chunk in audio_stream:
        chunks.append(chunk)

    audio_bytes = b"".join(chunks)
    logger.info("TTS: %d bytes ulaw (8kHz)", len(audio_bytes))
    return audio_bytes
