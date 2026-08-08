import unittest
from shared.graph.prompts import (
    PLANNER_SYSTEM_PROMPT,
    CODER_SYSTEM_PROMPT,
    REVISE_PLAN_SYSTEM_PROMPT,
    parse_json_response
)
from shared.graph.workflow import planner_node, coder_node

class TestPromptsAndWorkflow(unittest.TestCase):
    def test_prompts_exist(self):
        self.assertIn("Lead Principal Software Architect", PLANNER_SYSTEM_PROMPT)
        self.assertIn("Senior Staff Software Developer", CODER_SYSTEM_PROMPT)
        self.assertIn("PLANNER_SYSTEM_PROMPT", REVISE_PLAN_SYSTEM_PROMPT)

    def test_parse_json_response_with_fences(self):
        raw_llm_output = """```json
{
  "plan_title": "Test Plan",
  "steps": [{"step_number": 1, "action": "NEW"}]
}
```"""
        parsed = parse_json_response(raw_llm_output)
        self.assertEqual(parsed["plan_title"], "Test Plan")
        self.assertEqual(len(parsed["steps"]), 1)

    def test_parse_json_response_plain(self):
        raw_llm_output = '{"status": "ok"}'
        parsed = parse_json_response(raw_llm_output)
        self.assertEqual(parsed["status"], "ok")

    def test_planner_and_coder_node_execution(self):
        initial_state = {
            "task_id": "test-task-123",
            "prompt": "Create JWT authentication endpoint",
            "tokens_used": 0,
            "logs": []
        }
        planner_res = planner_node(initial_state)
        self.assertEqual(planner_res["status"], "awaiting_human_review")
        self.assertIn("structured_plan", planner_res)

        state_after_planner = {**initial_state, **planner_res}
        coder_res = coder_node(state_after_planner)
        self.assertEqual(coder_res["status"], "code_generated")
        self.assertIn("structured_code", coder_res)

if __name__ == "__main__":
    unittest.main()
