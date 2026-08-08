import json
from typing import Dict, Any, List

PLANNER_SYSTEM_PROMPT = """You are the Lead Principal Software Architect of DevAgents.
Your task is to analyze the user's software requirement prompt and decompose it into a clean, step-by-step technical implementation plan.

You MUST respond with valid JSON matching the following structure:
{
  "plan_title": "<Short Title>",
  "summary": "<High level technical summary>",
  "target_files": ["<list of file paths to modify or create>"],
  "steps": [
    {
      "step_number": 1,
      "component": "<Component Name>",
      "action": "<MODIFY|NEW|DELETE>",
      "file_path": "<Path>",
      "instructions": "<Detailed implementation instructions>"
    }
  ],
  "verification_commands": ["<test or validation command to run>"]
}
"""

CODER_SYSTEM_PROMPT = """You are the Senior Staff Software Developer of DevAgents.
Your task is to implement code and unit tests based on the architectural plan provided.

You MUST respond with valid JSON matching the following structure:
{
  "file_path": "<File path being modified/created>",
  "code": "<Complete, executable source code>",
  "test_file_path": "<Path to test file>",
  "test_code": "<Complete, runnable unit test code>",
  "commit_message": "<Conventional commit message>"
}
"""

REVISE_PLAN_SYSTEM_PROMPT = """You are the Lead Architect revising an implementation plan based on human feedback.
Analyze the human feedback and refine the technical plan accordingly. Respond with valid JSON matching the PLANNER_SYSTEM_PROMPT structure.
"""

def parse_json_response(content: str) -> Dict[str, Any]:
    """
    Utility function to strip markdown code fences (```json ... ```) and parse JSON payload safely.
    """
    clean_content = content.strip()
    if clean_content.startswith("```"):
        lines = clean_content.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        clean_content = "\n".join(lines).strip()
    
    try:
        return json.loads(clean_content)
    except json.JSONDecodeError:
        return {
            "raw_text": content,
            "error": "Failed to parse structured JSON response"
        }
