"""Add llm_calls ledger table

Revision ID: 002_add_llm_calls_table
Revises: 001_part1_initial_schema
Create Date: 2026-08-08 17:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '002_add_llm_calls_table'
down_revision: Union[str, None] = '001_part1_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table(
        'llm_calls',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('task_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False),
        sa.Column('node_name', sa.String(length=100), nullable=False, server_default='planner'),
        sa.Column('model', sa.String(length=100), nullable=False, server_default='gpt-4o'),
        sa.Column('prompt_tokens', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('completion_tokens', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('cost_usd', sa.Numeric(precision=10, scale=6), nullable=False, server_default='0.0'),
        sa.Column('latency_ms', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('langfuse_trace_id', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )

def downgrade() -> None:
    op.drop_table('llm_calls')
