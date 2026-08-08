import pytest
from shared.graph.workflow import route_test_results, coder_node, execute_tests_node
from shared.graph.test_runner import run_tests_locally


def test_route_passed():
    state = {"test_results": {"passed": True}, "retry_count": 0, "max_retries": 3, "tokens_used": 100, "token_budget": 100000}
    assert route_test_results(state) == "end"

def test_route_failed_with_retries():
    state = {"test_results": {"passed": False}, "retry_count": 1, "max_retries": 3, "tokens_used": 100, "token_budget": 100000}
    assert route_test_results(state) == "coder"

def test_route_failed_no_retries():
    state = {"test_results": {"passed": False}, "retry_count": 3, "max_retries": 3, "tokens_used": 100, "token_budget": 100000}
    assert route_test_results(state) == "aborted"

def test_route_budget_exceeded():
    state = {"test_results": {"passed": False}, "retry_count": 0, "max_retries": 3, "tokens_used": 100001, "token_budget": 100000}
    assert route_test_results(state) == "aborted"

def test_route_no_test_results_defaults():
    state = {"retry_count": 0, "max_retries": 3, "tokens_used": 0, "token_budget": 100000}
    assert route_test_results(state) == "coder"

def test_run_tests_locally_success():
    code = {
        "math_utils.py": "def multiply(a, b):\n    return a * b\n",
        "test_math_utils.py": "from math_utils import multiply\n\ndef test_multiply():\n    assert multiply(3, 4) == 12\n"
    }
    res = run_tests_locally(code)
    assert res["passed"] is True
    assert res["return_code"] == 0

def test_run_tests_locally_failure():
    code = {
        "math_utils.py": "def multiply(a, b):\n    return a + b\n",
        "test_math_utils.py": "from math_utils import multiply\n\ndef test_multiply():\n    assert multiply(3, 4) == 12\n"
    }
    res = run_tests_locally(code)
    assert res["passed"] is False
    assert res["return_code"] != 0
    assert res["traceback"] is not None

def test_execute_tests_node_empty():
    state = {"generated_code": {}, "logs": []}
    res = execute_tests_node(state)
    assert res["test_results"]["passed"] is True

