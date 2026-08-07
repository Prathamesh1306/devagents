"""Part 1 initial schema (tasks and checkpoints)

Revision ID: 001_part1_initial_schema
Revises: 
Create Date: 2026-08-08 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001_part1_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Create tasks table
    op.create_table(
        'tasks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('requested_by_user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('task_prompt', sa.Text(), nullable=False),
        sa.Column('source', sa.String(length=50), nullable=False, server_default='api'),
        sa.Column('final_status', sa.String(length=50), nullable=False, server_default='pending'),
        sa.Column('token_budget', sa.BigInteger(), nullable=False, server_default='100000'),
        sa.Column('tokens_used', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('pr_url', sa.Text(), nullable=True),
        sa.Column('trace_id', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )

    # 2. Create checkpoints table (LangGraph persistence)
    op.create_table(
        'checkpoints',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('task_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False),
        sa.Column('checkpoint_seq', sa.BigInteger(), nullable=False),
        sa.Column('node_name', sa.String(length=100), nullable=False),
        sa.Column('state_json', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )

    op.create_index('idx_checkpoints_task_seq', 'checkpoints', ['task_id', 'checkpoint_seq'])

def downgrade() -> None:
    op.drop_index('idx_checkpoints_task_seq', table_name='checkpoints')
    op.drop_table('checkpoints')
    op.drop_table('tasks')
