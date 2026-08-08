import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, BigInteger, Integer, Numeric, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from shared.db.base import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), nullable=True)
    project_id = Column(UUID(as_uuid=True), nullable=True)
    requested_by_user_id = Column(UUID(as_uuid=True), nullable=True)
    task_prompt = Column(Text, nullable=False)
    source = Column(String(50), nullable=False, default="api")
    final_status = Column(String(50), nullable=False, default="pending")
    token_budget = Column(BigInteger, nullable=False, default=100000)
    tokens_used = Column(BigInteger, nullable=False, default=0)
    pr_url = Column(Text, nullable=True)
    trace_id = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    llm_calls = relationship("LLMCall", back_populates="task", cascade="all, delete-orphan")


class LLMCall(Base):
    __tablename__ = "llm_calls"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    node_name = Column(String(100), nullable=False, default="planner")
    model = Column(String(100), nullable=False, default="gpt-4o")
    prompt_tokens = Column(Integer, nullable=False, default=0)
    completion_tokens = Column(Integer, nullable=False, default=0)
    cost_usd = Column(Numeric(10, 6), nullable=False, default=0.0)
    latency_ms = Column(Integer, nullable=False, default=0)
    langfuse_trace_id = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    task = relationship("Task", back_populates="llm_calls")
