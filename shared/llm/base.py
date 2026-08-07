from abc import ABC, abstractmethod
from typing import Optional
from pydantic import BaseModel, Field

class LLMResponse(BaseModel):
    content: str = Field(..., description="Generated text completion")
    model: str = Field(..., description="Model identifier used for generation")
    provider: str = Field(..., description="Provider name (openai, anthropic, ollama, stub)")
    prompt_tokens: int = Field(default=0, description="Tokens used in prompt")
    completion_tokens: int = Field(default=0, description="Tokens generated in completion")

    @property
    def total_tokens(self) -> int:
        return self.prompt_tokens + self.completion_tokens

class BaseLLMClient(ABC):
    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name

    @abstractmethod
    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7
    ) -> LLMResponse:
        """Generate text completion from LLM provider."""
        pass
