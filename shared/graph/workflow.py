from langgraph.graph import StateGraph, END
from shared.graph.state import DevAgentState

def planner_stub_node(state: DevAgentState) -> dict:
    prompt = state.get("prompt", "")
    task_id = state.get("task_id", "")
    logs = list(state.get("logs", []))
    
    plan = f"[STUB PLAN for Task {task_id}]: 1. Analyze prompt '{prompt}'. 2. Scrape AST context. 3. Output proposed implementation."
    logs.append(f"Planner stub node executed for task_id: {task_id}")
    
    return {
        "status": "completed",
        "implementation_plan": plan,
        "logs": logs,
        "tokens_used": state.get("tokens_used", 0) + 50
    }

def create_agent_graph(checkpointer=None):
    workflow = StateGraph(DevAgentState)
    workflow.add_node("planner", planner_stub_node)
    workflow.set_entry_point("planner")
    workflow.add_edge("planner", END)
    
    return workflow.compile(checkpointer=checkpointer)
