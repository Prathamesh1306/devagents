from typing import TypedDict, Optional, List

class DevAgentState(TypedDict):
    task_id: str
    prompt: str
    status: str
    implementation_plan: Optional[str]
    logs: List[str]
    tokens_used: int
