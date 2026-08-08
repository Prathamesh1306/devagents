from typing import TypedDict, Optional, List, Dict

class DevAgentState(TypedDict):
    # Core fields
    task_id: str
    prompt: str
    status: str
    implementation_plan: Optional[str]
    logs: List[str]
    tokens_used: int

    # Planning
    structured_plan: Optional[Dict]
    acceptance_criteria: Optional[List[str]]

    # Coding loop
    generated_code: Optional[Dict[str, str]]
    structured_code: Optional[Dict]
    retry_count: int
    max_retries: int
    last_traceback: Optional[str]
    error: Optional[str]

    # Test execution
    test_results: Optional[Dict]

    # Review
    review_status: Optional[str]
    security_findings: Optional[List[Dict]]

    # Human governance
    hitl_status: Optional[str]
    plan_approved: Optional[bool]
    human_feedback: Optional[str]

    # Budget & Outcome
    token_budget: int
    final_status: Optional[str]
    pr_url: Optional[str]
    trace_id: Optional[str]

