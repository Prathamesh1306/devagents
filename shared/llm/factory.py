import os
from typing import Optional
from shared.llm.base import BaseLLMClient
from shared.llm.providers import StubLLMClient, GeminiLLMClient, OpenAILLMClient, AnthropicLLMClient, OllamaLLMClient

def get_llm_client(provider: Optional[str] = None, model_name: Optional[str] = None) -> BaseLLMClient:
    """
    Factory function returning an LLM client provider instance based on provider name.
    Supported providers: 'gemini', 'openai', 'anthropic', 'ollama', 'stub'.
    """
    selected_provider = (provider or os.getenv("LLM_PROVIDER", "stub")).lower()

    if selected_provider == "gemini":
        return GeminiLLMClient(model_name=model_name)
    elif selected_provider == "openai":
        return OpenAILLMClient(model_name=model_name)
    elif selected_provider == "anthropic":
        return AnthropicLLMClient(model_name=model_name)
    elif selected_provider == "ollama":
        return OllamaLLMClient(model_name=model_name)
    elif selected_provider == "stub":
        return StubLLMClient(model_name=model_name)
    else:
        raise ValueError(f"Unsupported LLM provider '{selected_provider}'. Valid options: gemini, openai, anthropic, ollama, stub")
