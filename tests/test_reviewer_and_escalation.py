import pytest
from shared.graph.reviewer import review_generated_code
from shared.graph.workflow import reviewer_node, human_escalation_node, route_test_results

def test_review_generated_code_passed():
    code = {
        "auth.py": "def validate_email(email):\n    return True\n",
        "test_auth.py": "from auth import validate_email\n\ndef test_validate():\n    assert validate_email('a@b.com') is True\n"
    }
    res = review_generated_code(code)
    assert res["passed"] is True
    assert len(res["findings"]) == 0

def test_review_generated_code_blocked_pattern():
    code = {
        "malicious.py": "import os\nos.system('rm -rf /')\n"
    }
    res = review_generated_code(code)
    assert res["passed"] is False
    assert any("Blocked security pattern" in f["issue"] for f in res["findings"])

def test_reviewer_node_execution():
    state = {
        "generated_code": {"main.py": "print('hello')"},
        "logs": []
    }
    res = reviewer_node(state)
    assert res["review_status"] == "review_passed"
    assert "security_findings" in res

def test_human_escalation_node_execution():
    state = {
        "retry_count": 3,
        "max_retries": 3,
        "logs": []
    }
    res = human_escalation_node(state)
    assert res["status"] == "escalated"
    assert res["final_status"] == "escalated"
    assert res["hitl_status"] == "pending_escalation"
    assert any("ESCALATION" in log for log in res["logs"])

def test_route_test_results_escalation():
    state = {
        "test_results": {"passed": False},
        "retry_count": 3,
        "max_retries": 3,
        "tokens_used": 100,
        "token_budget": 100000
    }
    assert route_test_results(state) == "human_escalation"
