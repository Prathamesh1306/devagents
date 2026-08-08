import os
import json
import urllib.request
from typing import Optional
from shared.llm.base import BaseLLMClient, LLMResponse

class StubLLMClient(BaseLLMClient):
    """Fallback stub provider for testing and offline execution."""
    def __init__(self, model_name: Optional[str] = "stub-v1"):
        super().__init__(model_name=model_name or "stub-v1")

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7
    ) -> LLMResponse:
        content = f"[STUB LLM RESPONSE for prompt: '{prompt}'] Plan: 1. Parse prompt. 2. Implement logic. 3. Add tests."
        prompt_tokens = len(prompt.split())
        completion_tokens = len(content.split())
        return LLMResponse(
            content=content,
            model=self.model_name,
            provider="stub",
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens
        )

class OpenAILLMClient(BaseLLMClient):
    """OpenAI API provider wrapper."""
    def __init__(self, model_name: Optional[str] = None, api_key: Optional[str] = None):
        super().__init__(model_name=model_name or os.getenv("OPENAI_MODEL", "gpt-4o"))
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7
    ) -> LLMResponse:
        if not self.api_key:
            # Fallback to stub if API key is not configured
            res = StubLLMClient(model_name=f"{self.model_name}-stub").generate(prompt, system_prompt, max_tokens, temperature)
            res.provider = "openai"
            return res

        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model_name,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature
        }

        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            content = data["choices"][0]["message"]["content"]
            usage = data.get("usage", {})
            return LLMResponse(
                content=content,
                model=self.model_name,
                provider="openai",
                prompt_tokens=usage.get("prompt_tokens", len(prompt.split())),
                completion_tokens=usage.get("completion_tokens", len(content.split()))
            )

class AnthropicLLMClient(BaseLLMClient):
    """Anthropic Claude API provider wrapper."""
    def __init__(self, model_name: Optional[str] = None, api_key: Optional[str] = None):
        super().__init__(model_name=model_name or os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022"))
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7
    ) -> LLMResponse:
        if not self.api_key:
            res = StubLLMClient(model_name=f"{self.model_name}-stub").generate(prompt, system_prompt, max_tokens, temperature)
            res.provider = "anthropic"
            return res

        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "Content-Type": "application/json",
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01"
        }
        payload = {
            "model": self.model_name,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": max_tokens,
            "temperature": temperature
        }
        if system_prompt:
            payload["system"] = system_prompt

        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            content = data["content"][0]["text"]
            usage = data.get("usage", {})
            return LLMResponse(
                content=content,
                model=self.model_name,
                provider="anthropic",
                prompt_tokens=usage.get("input_tokens", len(prompt.split())),
                completion_tokens=usage.get("output_tokens", len(content.split()))
            )

class OllamaLLMClient(BaseLLMClient):
    """Local Ollama LLM provider wrapper."""
    def __init__(self, model_name: Optional[str] = None, host: Optional[str] = None):
        super().__init__(model_name=model_name or os.getenv("OLLAMA_MODEL", "llama3"))
        self.host = host or os.getenv("OLLAMA_HOST", "http://localhost:11434")

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7
    ) -> LLMResponse:
        url = f"{self.host}/api/generate"
        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": temperature, "num_predict": max_tokens}
        }
        if system_prompt:
            payload["system"] = system_prompt

        try:
            req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"}, method="POST")
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                content = data.get("response", "")
                return LLMResponse(
                    content=content,
                    model=self.model_name,
                    provider="ollama",
                    prompt_tokens=data.get("prompt_eval_count", len(prompt.split())),
                    completion_tokens=data.get("eval_count", len(content.split()))
                )
        except Exception:
            # If Ollama endpoint is not reachable locally, fall back gracefully to stub
            res = StubLLMClient(model_name=f"{self.model_name}-fallback").generate(prompt, system_prompt, max_tokens, temperature)
            res.provider = "ollama"
            return res

