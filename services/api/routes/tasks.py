import os
import uuid
import json
import urllib.request
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import text
from shared.db.session import get_db
from shared.db.models import Task, LLMCall
from services.worker.celery_app import run_task_graph

router = APIRouter(prefix="/tasks", tags=["Tasks"])

class TaskCreateRequest(BaseModel):
    task_prompt: str = Field(..., description="Prompt or task requirement")
    token_budget: Optional[int] = Field(default=100000, description="Max token budget allowed")
    source: Optional[str] = Field(default="api", description="Source of task (api, web, cli)")

class TaskReviewRequest(BaseModel):
    plan_approved: bool = Field(..., description="Whether to approve technical plan")
    human_feedback: Optional[str] = Field(default=None, description="Optional revision feedback")

@router.post("", status_code=status.HTTP_201_CREATED)
def create_task(req: TaskCreateRequest, db: Session = Depends(get_db)):
    task_id = uuid.uuid4()
    trace_id = f"trace-{uuid.uuid4().hex[:12]}"
    
    task = Task(
        id=task_id,
        task_prompt=req.task_prompt,
        token_budget=req.token_budget,
        source=req.source,
        final_status="pending",
        tokens_used=0,
        trace_id=trace_id
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    run_task_graph.delay(str(task.id))

    return {
        "id": str(task.id),
        "task_prompt": task.task_prompt,
        "final_status": task.final_status,
        "token_budget": task.token_budget,
        "tokens_used": task.tokens_used,
        "trace_id": task.trace_id,
        "created_at": task.created_at.isoformat() if task.created_at else "",
        "updated_at": task.updated_at.isoformat() if task.updated_at else ""
    }

@router.get("/list/all")
@router.get("/list")
def list_tasks(limit: int = 50, db: Session = Depends(get_db)):
    tasks = db.query(Task).order_by(Task.created_at.desc()).limit(limit).all()
    return [
        {
            "id": str(t.id),
            "task_prompt": t.task_prompt,
            "final_status": t.final_status,
            "token_budget": t.token_budget,
            "tokens_used": t.tokens_used,
            "pr_url": t.pr_url,
            "trace_id": t.trace_id,
            "created_at": t.created_at.isoformat() if t.created_at else "",
            "updated_at": t.updated_at.isoformat() if t.updated_at else ""
        }
        for t in tasks
    ]

@router.get("/llm/status")
def get_llm_status():
    provider = os.getenv("LLM_PROVIDER", "ollama").lower()
    ollama_host = os.getenv("OLLAMA_HOST", "http://ollama:11434")
    ollama_model = os.getenv("OLLAMA_MODEL", "llama3.1")
    gemini_key = bool(os.getenv("GEMINI_API_KEY"))

    reachable = False
    if provider == "ollama":
        try:
            url = f"{ollama_host}/api/tags"
            req = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(req, timeout=3) as resp:
                reachable = (resp.status == 200)
        except Exception:
            reachable = False
    elif provider in ["gemini", "openai", "anthropic"]:
        reachable = True if (gemini_key or os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")) else False
    else:
        reachable = True

    return {
        "provider": provider,
        "model": ollama_model if provider == "ollama" else os.getenv("GEMINI_MODEL", "gemini-flash-latest"),
        "host": ollama_host if provider == "ollama" else "cloud",
        "reachable": reachable
    }

@router.get("/{task_id}")
def get_task(task_id: str, db: Session = Depends(get_db)):
    try:
        task_uuid = uuid.UUID(task_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task UUID format")

    task = db.query(Task).filter(Task.id == task_uuid).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Retrieve checkpoint details
    checkpoint_sql = text("SELECT state_json FROM checkpoints WHERE task_id = :task_id ORDER BY created_at DESC LIMIT 1")
    res = db.execute(checkpoint_sql, {"task_id": task.id}).first()
    state_data = json.loads(res[0]) if res and res[0] else {}

    return {
        "id": str(task.id),
        "task_prompt": task.task_prompt,
        "final_status": task.final_status,
        "token_budget": task.token_budget,
        "tokens_used": task.tokens_used,
        "pr_url": task.pr_url,
        "trace_id": task.trace_id,
        "created_at": task.created_at.isoformat() if task.created_at else "",
        "updated_at": task.updated_at.isoformat() if task.updated_at else "",
        "checkpoint": state_data
    }

@router.get("/{task_id}/llm-calls")
def get_task_llm_calls(task_id: str, db: Session = Depends(get_db)):
    try:
        task_uuid = uuid.UUID(task_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task UUID format")

    calls = db.query(LLMCall).filter(LLMCall.task_id == task_uuid).order_by(LLMCall.created_at.asc()).all()
    return [
        {
            "id": str(c.id),
            "node_name": c.node_name,
            "model": c.model,
            "prompt_tokens": c.prompt_tokens,
            "completion_tokens": c.completion_tokens,
            "cost_usd": float(c.cost_usd),
            "latency_ms": c.latency_ms,
            "created_at": c.created_at.isoformat() if c.created_at else ""
        }
        for c in calls
    ]

@router.post("/{task_id}/review")
def review_task_plan(task_id: str, req: TaskReviewRequest, db: Session = Depends(get_db)):
    try:
        task_uuid = uuid.UUID(task_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task UUID format")

    task = db.query(Task).filter(Task.id == task_uuid).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    new_status = "plan_approved" if req.plan_approved else "plan_rejected"
    task.final_status = new_status
    db.commit()

    return {
        "id": str(task.id),
        "final_status": task.final_status,
        "plan_approved": req.plan_approved,
        "human_feedback": req.human_feedback
    }
