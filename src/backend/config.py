from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # General
    debug: bool = False
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    # Gemini (LLM + STT)
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    # ElevenLabs (TTS)
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = ""

    # MongoDB Atlas
    mongodb_uri: str = ""
    mongodb_database: str = "companion"

    # Telegram (alertas)
    telegram_bot_token: str = ""
    telegram_default_chat_id: str = ""
    telegram_alert_chat_ids: list[str] = []


@lru_cache
def get_settings() -> Settings:
    return Settings()
