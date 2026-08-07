import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, BigInteger, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
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
