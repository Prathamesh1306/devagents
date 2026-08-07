from langgraph.graph import StateGraph, END
from shared.graph.state import DevAgentState
from shared.llm import get_llm_client

def planner_node(state: DevAgentState) -> dict:
    prompt = state.get("prompt", "")
    task_id = state.get("task_id", "")
    logs = list(state.get("logs", []))
    
    # 1. Instantiate LLM Client Abstraction via factory (swappable by LLM_PROVIDER env var)
    llm = get_llm_client()
    
    # 2. Generate plan via LLM abstraction
    system_prompt = "You are DevAgents Spec & Task Planner. Generate a clear implementation plan."
    response = llm.generate(prompt=prompt, system_prompt=system_prompt)
    
    logs.append(f"Planner node executed using provider '{response.provider}' (model: '{response.model}') for task_id: {task_id}")
    
    return {
        "status": "completed",
        "implementation_plan": response.content,
        "logs": logs,
        "tokens_used": state.get("tokens_used", 0) + response.total_tokens
    }

def create_agent_graph(checkpointer=None):
    workflow = StateGraph(DevAgentState)
    workflow.add_node("planner", planner_node)
    workflow.set_entry_point("planner")
    workflow.add_edge("planner", END)
    
    return workflow.compile(checkpointer=checkpointer)

# Backward compatibility alias for stub node
planner_stub_node = planner_node

