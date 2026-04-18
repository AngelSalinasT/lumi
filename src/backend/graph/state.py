"""Estado del grafo LangGraph para Companion AI."""

from typing import Annotated, Sequence, TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class CompanionState(TypedDict):
    """Estado tipado del agente conversacional.

    Convención: los nodos retornan dicts parciales con SOLO los campos que cambian.
    LangGraph mergea automáticamente. El campo `messages` usa el reducer `add_messages`
    que appendea en vez de reemplazar.
    """

    # Identificación del dispositivo
    device_id: str

    # Input del usuario (transcripción STT o texto directo)
    transcription: str

    # Perfil del usuario (cargado de MongoDB al inicio)
    user_profile: dict

    # Historial de conversación (últimos N turnos de MongoDB)
    conversation_history: list[dict]

    # Mensajes internos de LangGraph (LLM + tool calls + tool results)
    # El reducer add_messages appendea, no reemplaza
    messages: Annotated[Sequence[BaseMessage], add_messages]

    # Respuesta final en texto (generada por agent_node)
    response_text: str | None

    # Audio de la respuesta (generado por tts_node)
    audio_response: bytes | None

    # Tools usadas en este turno (para tracking)
    tools_used: list[str]
