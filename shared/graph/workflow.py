from langgraph.graph import StateGraph, END
from shared.graph.state import DevAgentState
from shared.llm import get_llm_client
from shared.graph.prompts import (
    PLANNER_SYSTEM_PROMPT,
    CODER_SYSTEM_PROMPT,
    REVISE_PLAN_SYSTEM_PROMPT,
    parse_json_response
)
from shared.graph.circuit_breaker import check_token_budget

def planner_node(state: DevAgentState) -> dict:
    prompt = state.get("prompt", "")
    task_id = state.get("task_id", "")
    logs = list(state.get("logs", []))
    
    # 1. Pre-call circuit breaker check
    is_allowed, reason = check_token_budget(state, estimated_tokens=1500)
    if not is_allowed:
        logs.append(f"Planner node ABORTED: {reason}")
        return {
            "status": "failed_budget_exceeded",
            "logs": logs,
            "error": reason
        }
    
    llm = get_llm_client()
    response = llm.generate(prompt=prompt, system_prompt=PLANNER_SYSTEM_PROMPT)
    structured_plan = parse_json_response(response.content)
    
    logs.append(f"Planner node executed using provider '{response.provider}' (model: '{response.model}') for task_id: {task_id}")
    
    return {
        "status": "completed",
        "implementation_plan": response.content,
        "structured_plan": structured_plan,
        "logs": logs,
        "tokens_used": state.get("tokens_used", 0) + response.total_tokens
    }

def coder_node(state: DevAgentState) -> dict:
    plan = state.get("implementation_plan", "")
    task_id = state.get("task_id", "")
    logs = list(state.get("logs", []))
    
    # 1. Pre-call circuit breaker check
    is_allowed, reason = check_token_budget(state, estimated_tokens=2000)
    if not is_allowed:
        logs.append(f"Coder node ABORTED: {reason}")
        return {
            "status": "failed_budget_exceeded",
            "logs": logs,
            "error": reason
        }
    
    llm = get_llm_client()
    coder_prompt = f"Implementation Plan:\n{plan}\n\nGenerate source code and tests."
    response = llm.generate(prompt=coder_prompt, system_prompt=CODER_SYSTEM_PROMPT)
    structured_code = parse_json_response(response.content)
    
    logs.append(f"Coder node executed using provider '{response.provider}' (model: '{response.model}') for task_id: {task_id}")
    
    return {
        "status": "completed",
        "generated_code": response.content,
        "structured_code": structured_code,
        "logs": logs,
        "tokens_used": state.get("tokens_used", 0) + response.total_tokens
    }

def create_agent_graph(checkpointer=None):
    workflow = StateGraph(DevAgentState)
    workflow.add_node("planner", planner_node)
    workflow.add_node("coder", coder_node)
    workflow.set_entry_point("planner")
    workflow.add_edge("planner", "coder")
    workflow.add_edge("coder", END)
    
    return workflow.compile(checkpointer=checkpointer)

# Backward compatibility alias
planner_stub_node = planner_node
