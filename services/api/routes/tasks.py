import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from shared.db.session import get_db
from shared.db.models import Task
from services.worker.celery_app import run_task_graph

router = APIRouter(prefix="/tasks", tags=["Tasks"])

class TaskCreateRequest(BaseModel):
    task_prompt: str = Field(..., description="Prompt or task requirement")
    token_budget: Optional[int] = Field(default=100000, description="Max token budget allowed")
    source: Optional[str] = Field(default="api", description="Source of task (api, web, cli)")

class TaskResponse(BaseModel):
    id: str
    task_prompt: str
    final_status: str
    token_budget: int
    tokens_used: int
    pr_url: Optional[str] = None
    trace_id: Optional[str] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

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

    # Trigger Celery task asynchronously
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

@router.get("/{task_id}")
def get_task(task_id: str, db: Session = Depends(get_db)):
    try:
        task_uuid = uuid.UUID(task_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task UUID format")

    task = db.query(Task).filter(Task.id == task_uuid).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return {
        "id": str(task.id),
        "task_prompt": task.task_prompt,
        "final_status": task.final_status,
        "token_budget": task.token_budget,
        "tokens_used": task.tokens_used,
        "pr_url": task.pr_url,
        "trace_id": task.trace_id,
        "created_at": task.created_at.isoformat() if task.created_at else "",
        "updated_at": task.updated_at.isoformat() if task.updated_at else ""
    }
