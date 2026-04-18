import logging

from langchain_google_genai import ChatGoogleGenerativeAI

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def get_llm(tools: list | None = None):
    llm = ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=settings.gemini_api_key,
        temperature=0.7,
    )
    if tools:
        return llm.bind_tools(tools)
    return llm
