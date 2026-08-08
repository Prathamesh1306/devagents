"""
Pre-Call Token Budget Circuit Breaker Module for DevAgents Graph Execution.
"""
from typing import Tuple
from shared.graph.state import DevAgentState

class TokenBudgetExceededException(Exception):
    """Raised when estimated token consumption breaches the server-side budget ceiling."""
    pass

def check_token_budget(
    state: DevAgentState,
    estimated_tokens: int = 1000
) -> Tuple[bool, str]:
    """
    Evaluates current token consumption against server-side token budget ceiling.
    Returns (is_allowed, reason_message).
    """
    tokens_used = state.get("tokens_used", 0)
    token_budget = state.get("token_budget", 100000)

    if (tokens_used + estimated_tokens) > token_budget:
        reason = (
            f"Token budget circuit breaker tripped: current tokens ({tokens_used}) + "
            f"estimated ({estimated_tokens}) exceeds token_budget limit ({token_budget})."
        )
        return False, reason
    
    return True, "Budget check passed"
