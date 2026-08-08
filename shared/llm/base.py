import time
import uuid
from abc import ABC, abstractmethod
from typing import Optional
from pydantic import BaseModel, Field

class LLMResponse(BaseModel):
    content: str = Field(..., description="Generated text completion")
    model: str = Field(..., description="Model identifier used for generation")
    provider: str = Field(..., description="Provider name (openai, anthropic, ollama, stub)")
    prompt_tokens: int = Field(default=0, description="Tokens used in prompt")
    completion_tokens: int = Field(default=0, description="Tokens generated in completion")
    cost_usd: float = Field(default=0.0, description="Calculated USD cost")

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

    def log_llm_call(
        self,
        db_session,
        task_id: uuid.UUID,
        node_name: str,
        response: LLMResponse,
        latency_ms: int = 0,
        langfuse_trace_id: Optional[str] = None
    ):
        """Record an LLM call entry into PostgreSQL llm_calls ledger."""
        from shared.db.models import LLMCall
        call_record = LLMCall(
            task_id=task_id,
            node_name=node_name,
            model=response.model,
            prompt_tokens=response.prompt_tokens,
            completion_tokens=response.completion_tokens,
            cost_usd=response.cost_usd,
            latency_ms=latency_ms,
            langfuse_trace_id=langfuse_trace_id
        )
        db_session.add(call_record)
        db_session.commit()
        return call_record
