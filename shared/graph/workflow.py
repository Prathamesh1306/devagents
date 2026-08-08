from langgraph.graph import StateGraph, END
from shared.graph.state import DevAgentState
from shared.llm import get_llm_client
from shared.graph.prompts import (
    PLANNER_SYSTEM_PROMPT,
    CODER_SYSTEM_PROMPT,
    REVISE_PLAN_SYSTEM_PROMPT,
    parse_json_response,
    parse_code_response
)
from shared.graph.circuit_breaker import check_token_budget
from shared.graph.test_runner import run_tests_locally

def planner_node(state: DevAgentState) -> dict:
    prompt = state.get("prompt") or state.get("task_prompt", "")
    task_id = state.get("task_id", "")
    logs = list(state.get("logs", []))
    feedback = state.get("human_feedback", None)
    
    # 1. Pre-call circuit breaker check
    is_allowed, reason = check_token_budget(state, estimated_tokens=1500)
    if not is_allowed:
        logs.append(f"Planner node ABORTED: {reason}")
        return {
            "status": "failed_budget_exceeded",
            "final_status": "failed_budget_exceeded",
            "logs": logs,
            "error": reason
        }
    
    llm = get_llm_client()
    system_prompt = REVISE_PLAN_SYSTEM_PROMPT if feedback else PLANNER_SYSTEM_PROMPT
    full_prompt = f"Requirement: {prompt}\n\nHuman Feedback: {feedback}" if feedback else prompt
    
    response = llm.generate(prompt=full_prompt, system_prompt=system_prompt)
    structured_plan = parse_json_response(response.content)
    
    logs.append(f"Planner node executed (revision={bool(feedback)}) using '{response.provider}' ({response.model}) for task: {task_id}")
    
    return {
        "status": "awaiting_human_review",
        "implementation_plan": response.content,
        "structured_plan": structured_plan,
        "logs": logs,
        "tokens_used": state.get("tokens_used", 0) + response.total_tokens
    }

def human_review_node(state: DevAgentState) -> dict:
    logs = list(state.get("logs", []))
    plan_approved = state.get("plan_approved", True)
    
    if plan_approved:
        logs.append("Human HITL gate: Technical plan APPROVED. Proceeding to Coder node.")
        return {"status": "plan_approved", "logs": logs}
    else:
        logs.append("Human HITL gate: Technical plan REJECTED with feedback. Routing back to Planner node.")
        return {"status": "plan_rejected", "logs": logs}

def route_after_human_review(state: DevAgentState) -> str:
    if state.get("plan_approved", True):
        return "coder"
    return "planner"

def coder_node(state: DevAgentState) -> dict:
    plan = state.get("implementation_plan", "")
    task_id = state.get("task_id", "")
    logs = list(state.get("logs", []))
    retry_count = state.get("retry_count", 0)
    last_traceback = state.get("last_traceback", None)
    
    # 1. Pre-call circuit breaker check
    is_allowed, reason = check_token_budget(state, estimated_tokens=2000)
    if not is_allowed:
        logs.append(f"Coder node ABORTED: {reason}")
        return {
            "status": "failed_budget_exceeded",
            "final_status": "failed_budget_exceeded",
            "logs": logs,
            "error": reason
        }
    
    llm = get_llm_client()
    coder_prompt = f"Implementation Plan:\n{plan}\n\nGenerate source code and tests."
    if last_traceback:
        coder_prompt += f"\n\nPREVIOUS ATTEMPT FAILED. Fix this specific error:\n{last_traceback}"

    response = llm.generate(prompt=coder_prompt, system_prompt=CODER_SYSTEM_PROMPT)
    generated_code = parse_code_response(response.content)
    
    logs.append(f"Coder node executed (retry={retry_count}) using '{response.provider}' ({response.model}) — generated {len(generated_code)} files")
    
    return {
        "status": "code_generated",
        "generated_code": generated_code,
        "structured_code": parse_json_response(response.content),
        "retry_count": retry_count + 1,
        "logs": logs,
        "tokens_used": state.get("tokens_used", 0) + response.total_tokens
    }

def execute_tests_node(state: DevAgentState) -> dict:
    """Execute generated code tests in a local subprocess with timeout."""
    logs = list(state.get("logs", []))
    generated_code = state.get("generated_code") or {}

    if not generated_code:
        logs.append("Test runner: No generated code to test. Skipping.")
        return {
            "test_results": {"passed": True, "output": "No code to test", "traceback": None},
            "logs": logs
        }

    logs.append(f"Test runner: executing tests for {len(generated_code)} generated files...")
    test_results = run_tests_locally(generated_code, timeout_seconds=60)

    if test_results["passed"]:
        logs.append("Test runner: ✅ ALL TESTS PASSED")
    else:
        logs.append(f"Test runner: ❌ TESTS FAILED (return_code={test_results['return_code']})")

    return {
        "test_results": test_results,
        "last_traceback": test_results.get("traceback"),
        "logs": logs
    }

def route_test_results(state: DevAgentState) -> str:
    """Deterministic router: budget check → retry check → pass/fail routing."""
    # Budget gate
    tokens_used = state.get("tokens_used", 0)
    token_budget = state.get("token_budget", 100000)
    if tokens_used >= token_budget:
        return "aborted"

    test_results = state.get("test_results") or {}
    if test_results.get("passed", False):
        return "end"

    # Tests failed — check retry budget
    retry_count = state.get("retry_count", 0)
    max_retries = state.get("max_retries", 3)
    if retry_count < max_retries:
        return "coder"
    return "aborted"

def aborted_node(state: DevAgentState) -> dict:
    """Terminal node for tasks that exhaust retries or budget."""
    logs = list(state.get("logs", []))
    retry_count = state.get("retry_count", 0)
    max_retries = state.get("max_retries", 3)
    tokens_used = state.get("tokens_used", 0)
    token_budget = state.get("token_budget", 100000)

    if tokens_used >= token_budget:
        reason = f"Token budget exceeded ({tokens_used}/{token_budget})"
    else:
        reason = f"Max retries exhausted ({retry_count}/{max_retries})"

    logs.append(f"Task ABORTED: {reason}")
    return {
        "status": "aborted",
        "final_status": "aborted",
        "logs": logs,
        "error": reason
    }

def create_agent_graph(checkpointer=None):
    workflow = StateGraph(DevAgentState)
    
    # Register nodes
    workflow.add_node("planner", planner_node)
    workflow.add_node("human_review", human_review_node)
    workflow.add_node("coder", coder_node)
    workflow.add_node("test_runner", execute_tests_node)
    workflow.add_node("aborted", aborted_node)
    
    # Entry point & edges
    workflow.set_entry_point("planner")
    workflow.add_edge("planner", "human_review")
    workflow.add_conditional_edges(
        "human_review",
        route_after_human_review,
        {
            "coder": "coder",
            "planner": "planner"
        }
    )
    workflow.add_edge("coder", "test_runner")
    workflow.add_conditional_edges(
        "test_runner",
        route_test_results,
        {
            "coder": "coder",
            "end": END,
            "aborted": "aborted"
        }
    )
    workflow.add_edge("aborted", END)
    
    return workflow.compile(checkpointer=checkpointer)

# Backward compatibility alias
planner_stub_node = planner_node
