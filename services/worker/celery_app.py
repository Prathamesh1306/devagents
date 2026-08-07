import os
import uuid
import json
from celery import Celery
from sqlalchemy.orm import Session
from shared.db.session import SessionLocal
from shared.db.models import Task
from shared.graph.workflow import create_agent_graph
from shared.graph.state import DevAgentState
from sqlalchemy import text

REDIS_URL = os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0")

celery_app = Celery("devagents_worker", broker=REDIS_URL, backend=REDIS_URL)

@celery_app.task(name="run_task_graph")
def run_task_graph(task_id_str: str):
    db: Session = SessionLocal()
    try:
        task_uuid = uuid.UUID(task_id_str)
        task = db.query(Task).filter(Task.id == task_uuid).first()
        if not task:
            print(f"[Worker Error] Task {task_id_str} not found in DB.")
            return

        # 1. Update status to running
        task.final_status = "running"
        db.commit()

        # 2. Prepare initial State
        initial_state: DevAgentState = {
            "task_id": task_id_str,
            "prompt": task.task_prompt,
            "status": "running",
            "implementation_plan": None,
            "logs": [f"Task {task_id_str} initialized in worker."],
            "tokens_used": 0
        }

        # 3. Create & execute LangGraph compiled graph
        graph = create_agent_graph()
        final_state = graph.invoke(initial_state)

        # 4. Save checkpoint record to DB (P1-S3 acceptance requirement)
        checkpoint_id = uuid.uuid4()
        checkpoint_sql = text("""
            INSERT INTO checkpoints (id, task_id, checkpoint_seq, node_name, state_json, created_at)
            VALUES (:id, :task_id, :checkpoint_seq, :node_name, :state_json, NOW())
        """)
        db.execute(checkpoint_sql, {
            "id": checkpoint_id,
            "task_id": task.id,
            "checkpoint_seq": 1,
            "node_name": "planner",
            "state_json": json.dumps({
                "status": final_state.get("status"),
                "implementation_plan": final_state.get("implementation_plan"),
                "logs": final_state.get("logs"),
                "tokens_used": final_state.get("tokens_used")
            })
        })

        # 5. Update Task record
        task.final_status = final_state.get("status", "completed")
        task.tokens_used = final_state.get("tokens_used", 0)
        db.commit()

        print(f"[Worker Success] Task {task_id_str} completed successfully.")
        return final_state
    except Exception as e:
        db.rollback()
        print(f"[Worker Exception] Task {task_id_str} failed: {e}")
        task = db.query(Task).filter(Task.id == uuid.UUID(task_id_str)).first()
        if task:
            task.final_status = "failed"
            db.commit()
        raise e
    finally:
        db.close()
