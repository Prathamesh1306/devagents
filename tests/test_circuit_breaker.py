import unittest
from shared.graph.circuit_breaker import check_token_budget
from shared.graph.workflow import planner_node, coder_node

class TestCircuitBreaker(unittest.TestCase):
    def test_circuit_breaker_pass(self):
        state = {
            "tokens_used": 1000,
            "token_budget": 50000
        }
        is_allowed, reason = check_token_budget(state, estimated_tokens=1500)
        self.assertTrue(is_allowed)
        self.assertEqual(reason, "Budget check passed")

    def test_circuit_breaker_trip(self):
        state = {
            "tokens_used": 49000,
            "token_budget": 50000
        }
        is_allowed, reason = check_token_budget(state, estimated_tokens=2000)
        self.assertFalse(is_allowed)
        self.assertIn("Token budget circuit breaker tripped", reason)

    def test_planner_node_aborted_when_budget_exceeded(self):
        exceeded_state = {
            "task_id": "test-exceeded-1",
            "prompt": "Build rocket engine",
            "tokens_used": 49500,
            "token_budget": 50000,
            "logs": []
        }
        res = planner_node(exceeded_state)
        self.assertEqual(res["status"], "failed_budget_exceeded")
        self.assertIn("error", res)

    def test_coder_node_aborted_when_budget_exceeded(self):
        exceeded_state = {
            "task_id": "test-exceeded-2",
            "implementation_plan": "Plan summary",
            "tokens_used": 49000,
            "token_budget": 50000,
            "logs": []
        }
        res = coder_node(exceeded_state)
        self.assertEqual(res["status"], "failed_budget_exceeded")
        self.assertIn("error", res)

if __name__ == "__main__":
    unittest.main()
