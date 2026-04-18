"""Nodos del grafo LangGraph — cada nodo retorna un dict parcial del estado."""

import logging
from pathlib import Path
from typing import Any

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage

from graph.llm import get_llm
from graph.state import CompanionState
from graph.tools import companion_tools, TOOLS_BY_NAME
from services.tts import text_to_speech

logger = logging.getLogger(__name__)

PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "companion.md"


def _load_prompt() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8")


def _build_system_prompt(state: CompanionState) -> str:
    """Inyecta variables dinámicas del perfil en el prompt template.

    Patrón de agentcode-med: todas las variables se inyectan vía replace
    en el mono-prompt. El prompt nunca se modifica en runtime, solo las variables.
    """
    from datetime import datetime

    prompt = _load_prompt()
    profile = state.get("user_profile") or {}
    name = profile.get("name", "amigo")
    medications = profile.get("medications", [])
    family = profile.get("family_contacts", [])
    interests = profile.get("interests", {})

    # Fecha y hora actual
    now = datetime.now()
    fecha_hora = now.strftime("%H:%M del %A %d de %B de %Y")

    # Medicamentos formateados
    med_text = "\n".join(
        f"  - {m['name']}"
        + (f" ({m['dose']})" if m.get("dose") else "")
        + (f" a las {m['time']}" if m.get("time") else "")
        for m in medications
    ) if medications else "ninguno registrado"

    # Familiares formateados
    family_text = "\n".join(
        f"  - {f['name']} ({f.get('relation', '')})"
        + (f" — tel: {f['phone']}" if f.get("phone") else "")
        for f in family
    ) if family else "ninguno registrado"

    # Gustos e intereses
    gustos_parts = []
    for key, val in interests.items():
        if isinstance(val, list):
            gustos_parts.append(f"  - {key}: {', '.join(str(v) for v in val)}")
        elif isinstance(val, dict):
            for k2, v2 in val.items():
                gustos_parts.append(f"  - {k2}: {v2}")
        else:
            gustos_parts.append(f"  - {key}: {val}")
    for key in ("favorite_team", "favorite_music", "hobby"):
        if key in profile:
            label = key.replace("favorite_", "").replace("_", " ")
            gustos_parts.append(f"  - {label}: {profile[key]}")
    gustos_text = "\n".join(gustos_parts) if gustos_parts else "aún no los conozco"

    # Padecimientos
    conditions = profile.get("health_conditions", [])
    padecimientos_text = "\n".join(f"  - {c}" for c in conditions) if conditions else "ninguno registrado"

    # Estado de onboarding
    conversation_history = state.get("conversation_history", [])
    if name == "amigo":
        onboarding_status = "nuevo"
    elif profile.get("onboarding_done") and not conversation_history:
        onboarding_status = "app_configurado"
    else:
        onboarding_status = "completado"

    # Inyectar todas las variables
    prompt = prompt.replace("{{fecha_hora}}", fecha_hora)
    prompt = prompt.replace("{{nombre_usuario}}", name)
    prompt = prompt.replace("{{medicamentos}}", med_text)
    prompt = prompt.replace("{{familiares}}", family_text)
    prompt = prompt.replace("{{gustos}}", gustos_text)
    prompt = prompt.replace("{{padecimientos}}", padecimientos_text)
    prompt = prompt.replace("{{onboarding_status}}", onboarding_status)

    return prompt


def _extract_text(content) -> str:
    """Extrae texto plano del contenido de un mensaje (Gemini puede devolver lista)."""
    if isinstance(content, list):
        return "".join(
            block.get("text", "") if isinstance(block, dict) else str(block)
            for block in content
        ).strip()
    return str(content).strip() if content else ""


async def agent_node(state: CompanionState) -> dict[str, Any]:
    """Nodo principal del agente. Invoca el LLM.

    - Primer turno: CON tools (puede decidir usar herramientas)
    - Después de tool call: SIN tools, con contexto limpio para generar respuesta de texto
    """
    system_prompt = _build_system_prompt(state)
    has_prior_messages = state.get("messages") and len(state["messages"]) > 0

    if has_prior_messages:
        # Después de tool call: LLM SIN tools
        # Construir contexto limpio para evitar error de Gemini con tool calls huérfanos
        llm = get_llm(tools=None)

        # Extraer resultados de tools del historial
        tool_results = []
        for msg in state["messages"]:
            if isinstance(msg, ToolMessage):
                tool_results.append(f"{msg.name}: {_extract_text(msg.content)}")

        context = "; ".join(tool_results) if tool_results else "completado"

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=(
                f"El usuario dijo: \"{state['transcription']}\"\n"
                f"Ya ejecutaste estas herramientas: {context}\n"
                f"Ahora responde al usuario brevemente."
            )),
        ]
    else:
        # Primer turno: CON tools
        llm = get_llm(tools=companion_tools)
        history_messages = []
        for turn in state.get("conversation_history", [])[-10:]:
            if turn["role"] == "user":
                history_messages.append(HumanMessage(content=turn["content"]))
            else:
                history_messages.append(AIMessage(content=turn["content"]))

        messages = [
            SystemMessage(content=system_prompt),
            *history_messages,
            HumanMessage(content=state["transcription"]),
        ]

    response = await llm.ainvoke(messages)
    text = _extract_text(response.content)

    logger.info("Agente respondió: %s", text[:100] if text else "(vacío)")

    # Retornar dict parcial — solo los campos que cambian
    return {
        "messages": [response],
        "response_text": text if text else "¡Aquí estoy contigo!",
    }


async def tools_node(state: CompanionState) -> dict[str, Any]:
    """Ejecuta tool calls y persiste side effects en MongoDB.

    Patrón del proyecto de referencia: custom executor que:
    1. Ejecuta cada tool call
    2. Persiste side effects (MongoDB, alertas)
    3. Retorna ToolMessages al estado
    4. Trackea tools usadas
    """
    from services.medications import mark_medication_taken
    from services.mongo import add_medication, save_family_contact, update_user_field

    last_msg = state["messages"][-1]
    if not hasattr(last_msg, "tool_calls") or not last_msg.tool_calls:
        return {"messages": []}

    device_id = state.get("device_id", "default_device")
    results: list[ToolMessage] = []
    tools_used = list(state.get("tools_used", []))

    for tc in last_msg.tool_calls:
        tool_name = tc["name"]
        tool_args = tc.get("args", {})
        tool_fn = TOOLS_BY_NAME.get(tool_name)

        if tool_fn is None:
            results.append(ToolMessage(
                content=f"Tool '{tool_name}' no encontrada.",
                tool_call_id=tc["id"],
            ))
            continue

        # Ejecutar la tool
        try:
            result = await tool_fn.ainvoke(tool_args)
        except Exception as e:
            logger.error("Error ejecutando tool %s: %s", tool_name, e)
            result = f"Error: {e}"

        # Persistir side effects en MongoDB según el tipo de tool
        try:
            if tool_name == "save_user_info":
                await update_user_field(device_id, tool_args.get("field", ""), tool_args.get("value", ""))
            elif tool_name == "medication_reminder":
                await add_medication(device_id, tool_args["medication_name"], tool_args.get("dose", ""), tool_args.get("time", ""))
                logger.info("MongoDB: medicamento %s guardado para %s", tool_args["medication_name"], device_id)
            elif tool_name == "save_family_contact":
                await save_family_contact(device_id, tool_args["name"], tool_args["relation"], tool_args.get("phone", ""))
                logger.info("MongoDB: contacto %s guardado para %s", tool_args["name"], device_id)
            elif tool_name == "confirm_medication":
                mark_medication_taken(device_id, tool_args["medication_name"], tool_args.get("taken", True))
            elif tool_name == "send_alert":
                from services.alerts import send_emergency_alert
                user_profile = state.get("user_profile", {})
                await send_emergency_alert(device_id, tool_args["reason"], user_profile.get("name", "Usuario"))
        except Exception as e:
            logger.error("Error persistiendo side effect de %s: %s", tool_name, e)

        tools_used.append(tool_name)

        results.append(ToolMessage(
            content=str(result),
            name=tool_name,
            tool_call_id=tc["id"],
        ))

    # Dict parcial: solo messages y tools_used
    return {
        "messages": results,
        "tools_used": tools_used,
    }


async def tts_node(state: CompanionState) -> dict[str, Any]:
    """Convierte response_text a audio via ElevenLabs."""
    text = state.get("response_text", "")
    if not text:
        text = "¡Aquí estoy contigo!"

    audio_bytes = await text_to_speech(text)
    logger.info("TTS generó %d bytes de audio", len(audio_bytes))

    return {"audio_response": audio_bytes}
