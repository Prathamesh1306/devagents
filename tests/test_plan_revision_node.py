import unittest
from shared.graph.workflow import planner_node, human_review_node, route_after_human_review, coder_node

class TestPlanRevisionNode(unittest.TestCase):
    def test_human_review_node_approved(self):
        state = {
            "plan_approved": True,
            "logs": []
        }
        res = human_review_node(state)
        self.assertEqual(res["status"], "plan_approved")
        self.assertEqual(route_after_human_review(state), "coder")

    def test_human_review_node_rejected(self):
        state = {
            "plan_approved": False,
            "human_feedback": "Add PostgreSQL connection pool optimization",
            "logs": []
        }
        res = human_review_node(state)
        self.assertEqual(res["status"], "plan_rejected")
        self.assertEqual(route_after_human_review(state), "planner")

    def test_planner_node_revision_with_feedback(self):
        state = {
            "task_id": "test-rev-1",
            "prompt": "Create user auth endpoint",
            "human_feedback": "Use JWT Bearer tokens with 15min expiry",
            "tokens_used": 0,
            "logs": []
        }
        res = planner_node(state)
        self.assertEqual(res["status"], "awaiting_human_review")
        self.assertIn("structured_plan", res)
        self.assertTrue(any("revision=True" in log for log in res["logs"]))

if __name__ == "__main__":
    unittest.main()
