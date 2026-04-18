"""Constructor del grafo LangGraph — solo wiring de nodos y edges."""

from langchain_core.messages import AIMessage
from langgraph.graph import END, StateGraph

from graph.nodes import agent_node, tools_node, tts_node
from graph.state import CompanionState


def should_continue(state: CompanionState) -> str:
    """Router: si el LLM pidió tool calls → tools, si no → tts."""
    last_message = state["messages"][-1]
    if isinstance(last_message, AIMessage) and getattr(last_message, "tool_calls", None):
        return "tools"
    return "tts"


def build_graph():
    """
    Estructura del grafo:
    START → agent → should_continue
                        |→ tools → agent (loop)
                        |→ tts → END
    """
    graph = StateGraph(CompanionState)

    graph.add_node("agent", agent_node)
    graph.add_node("tools", tools_node)
    graph.add_node("tts", tts_node)

    graph.set_entry_point("agent")

    graph.add_conditional_edges(
        "agent",
        should_continue,
        {"tools": "tools", "tts": "tts"},
    )
    graph.add_edge("tools", "agent")
    graph.add_edge("tts", END)

    return graph.compile()


companion_graph = build_graph()
