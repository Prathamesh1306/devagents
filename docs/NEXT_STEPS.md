# DevAgents — Next Immediate Steps (P3-S1 & P3-S2)

> **Context**: Part 1 (Foundation) and Part 2 (LLM Integration) are COMPLETE and merged.
> **Objective**: Implement Part 3 — Code Generation Loop (no sandbox yet).
> **Max Stories Per Run**: 2

---

## Pre-Implementation Context

### What Already Exists (DO NOT rewrite these)

| File | What It Does |
|------|-------------|
| `shared/graph/state.py` | `DevAgentState` TypedDict (currently 6 fields — needs expansion) |
| `shared/graph/workflow.py` | LangGraph graph: `planner → human_review → coder → END` |
| `shared/graph/circuit_breaker.py` | `check_token_budget()` pre-call budget check |
| `shared/graph/prompts/planner.py` | `PLANNER_SYSTEM_PROMPT` — structured JSON output prompt |
| `shared/graph/prompts/coder.py` | `CODER_SYSTEM_PROMPT` — structured JSON output prompt |
| `shared/graph/prompts/parser.py` | `parse_json_response()` — strips markdown fences, parses JSON |
| `shared/graph/prompts/reviewer.py` | `REVISE_PLAN_SYSTEM_PROMPT` |
| `shared/llm/base.py` | `BaseLLMClient`, `LLMResponse` pydantic model |
| `shared/llm/factory.py` | `get_llm_client()` factory |
| `shared/llm/providers.py` | `GeminiLLMClient`, `OpenAILLMClient`, `AnthropicLLMClient`, `OllamaLLMClient`, `StubLLMClient` |
| `shared/db/models.py` | `Task`, `LLMCall` SQLAlchemy models |
| `shared/db/session.py` | `SessionLocal`, `get_db` |
| `services/api/routes/tasks.py` | `POST /tasks`, `GET /tasks/{id}`, `GET /tasks/list`, `GET /tasks/{id}/llm-calls`, `POST /tasks/{id}/review` |
| `services/worker/celery_app.py` | `run_task_graph` Celery task |
| `services/frontend/` | React + Vite + Tailwind dashboard |
| `tests/` | 6 test files for existing P1+P2 stories |

### Current Graph Flow
```
planner_node → human_review_node → (approved? → coder_node → END) | (rejected? → planner_node)
```

### Current DevAgentState (6 fields)
```python
class DevAgentState(TypedDict):
    task_id: str
    prompt: str
    status: str
    implementation_plan: Optional[str]
    logs: List[str]
    tokens_used: int
```

---

## STORY 1: P3-S1 — Expand DevAgentState + Code Agent with Structured Multi-File Output

**GitHub Issue**: `#12`
**Branch**: `feature/p3-s1-code-agent-structured-output`

### What to Build

#### 1. Expand `DevAgentState` in `shared/graph/state.py`

Add ALL fields needed for the self-healing code loop. Keep backward compatibility with existing fields (`prompt` stays as alias for `task_prompt`, `status` stays).

```python
from typing import TypedDict, Optional, List, Dict

class DevAgentState(TypedDict):
    # Existing fields (keep for backward compat)
    task_id: str
    prompt: str
    status: str
    implementation_plan: Optional[str]
    logs: List[str]
    tokens_used: int

    # NEW: Planning
    structured_plan: Optional[Dict]            # parsed JSON plan from planner
    acceptance_criteria: Optional[List[str]]

    # NEW: Coding loop
    generated_code: Optional[Dict[str, str]]   # {filepath: content} multi-file output
    structured_code: Optional[Dict]            # parsed JSON from coder
    retry_count: int                           # default 0
    max_retries: int                           # default 3
    last_traceback: Optional[str]              # scoped failing test traceback
    error: Optional[str]                       # error message if budget/parse fail

    # NEW: Test execution
    test_results: Optional[Dict]               # {"passed": bool, "traceback": str, "output": str}

    # NEW: Review
    review_status: Optional[str]               # "pending" / "passed" / "changes_requested"
    security_findings: Optional[List[Dict]]

    # NEW: Human governance
    hitl_status: Optional[str]                 # "not_reached" / "pending" / "approved" / "rejected"
    plan_approved: Optional[bool]
    human_feedback: Optional[str]

    # NEW: Budget
    token_budget: int                          # hard ceiling

    # NEW: Outcome
    final_status: Optional[str]
    pr_url: Optional[str]
    trace_id: Optional[str]
```

#### 2. Upgrade `CODER_SYSTEM_PROMPT` in `shared/graph/prompts/coder.py`

The current coder prompt asks for single-file JSON output. Upgrade it to support **multi-file output**:

```python
CODER_SYSTEM_PROMPT = """You are the Senior Staff Software Developer of DevAgents.
Your task is to implement code and unit tests based on the architectural plan provided.

You MUST respond with valid JSON matching the following structure:
{
  "files": [
    {
      "file_path": "<relative file path>",
      "content": "<complete file content>",
      "action": "CREATE|MODIFY"
    }
  ],
  "test_files": [
    {
      "file_path": "<relative test file path>",
      "content": "<complete test file content>"
    }
  ],
  "commit_message": "<conventional commit message>"
}

RULES:
- Generate COMPLETE file contents, not partial snippets.
- Include ALL necessary imports in every file.
- Write at least 1 test per file.
- Use relative paths from project root.
- Respond with ONLY the JSON. No explanations before or after.
"""
```

#### 3. Add a robust multi-format code parser in `shared/graph/prompts/parser.py`

Add a NEW function `parse_code_response()` that handles LLM output in multiple formats. Keep existing `parse_json_response()` untouched.

```python
def parse_code_response(content: str) -> Dict[str, str]:
    """
    Parse LLM coder output into {filepath: content} dict.
    Handles: JSON format, markdown code blocks with filenames, and raw text fallback.
    Returns dict of {filepath: file_content}.
    """
    # Strategy 1: Try JSON parse first
    parsed = parse_json_response(content)
    if "files" in parsed:
        result = {}
        for f in parsed["files"]:
            result[f["file_path"]] = f["content"]
        for f in parsed.get("test_files", []):
            result[f["file_path"]] = f["content"]
        return result

    # Strategy 2: Try markdown code blocks with filenames
    # Pattern: ```python:path/to/file.py or ```path/to/file.py
    import re
    pattern = r'```[\w]*:?([\w/._-]+)\n(.*?)```'
    matches = re.findall(pattern, content, re.DOTALL)
    if matches:
        return {filepath.strip(): code.strip() for filepath, code in matches}

    # Strategy 3: Fallback — return raw content as single file
    return {"generated_output.py": content}
```

#### 4. Update `coder_node` in `shared/graph/workflow.py`

Update the coder node to use `parse_code_response()` and populate `generated_code` dict:

```python
from shared.graph.prompts import parse_code_response  # NEW import

def coder_node(state: DevAgentState) -> dict:
    plan = state.get("implementation_plan", "")
    task_id = state.get("task_id", "")
    logs = list(state.get("logs", []))
    retry_count = state.get("retry_count", 0)
    last_traceback = state.get("last_traceback", None)

    # Pre-call circuit breaker
    is_allowed, reason = check_token_budget(state, estimated_tokens=2000)
    if not is_allowed:
        logs.append(f"Coder node ABORTED: {reason}")
        return {"status": "failed_budget_exceeded", "logs": logs, "error": reason}

    llm = get_llm_client()

    # Build context-aware prompt
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
```

#### 5. Update `celery_app.py` initial state to include new fields

In `services/worker/celery_app.py`, update the `initial_state` dict to include the new fields with defaults:

```python
initial_state: DevAgentState = {
    "task_id": task_id_str,
    "prompt": task.task_prompt,
    "status": "running",
    "implementation_plan": None,
    "logs": [f"Task {task_id_str} initialized in worker."],
    "tokens_used": 0,
    # NEW defaults:
    "structured_plan": None,
    "acceptance_criteria": None,
    "generated_code": None,
    "structured_code": None,
    "retry_count": 0,
    "max_retries": 3,
    "last_traceback": None,
    "error": None,
    "test_results": None,
    "review_status": None,
    "security_findings": None,
    "hitl_status": "not_reached",
    "plan_approved": True,
    "human_feedback": None,
    "token_budget": task.token_budget or 100000,
    "final_status": "running",
    "pr_url": None,
    "trace_id": task.trace_id,
}
```

### Acceptance Criteria (P3-S1)
- [ ] `DevAgentState` has all fields listed above.
- [ ] `coder_node` returns `generated_code` as a `{filepath: content}` dict.
- [ ] `parse_code_response()` handles JSON multi-file format.
- [ ] `parse_code_response()` handles markdown code block format as fallback.
- [ ] `parse_code_response()` returns raw text fallback when all else fails.
- [ ] Existing `planner_node` and `human_review_node` still work unchanged.
- [ ] `celery_app.py` initial state includes all new field defaults.
- [ ] All existing tests in `tests/` still pass.
- [ ] New test file: `tests/test_code_parser.py` with 5+ test cases covering all parser strategies.

### Test File to Create: `tests/test_code_parser.py`

```python
import pytest
from shared.graph.prompts.parser import parse_code_response, parse_json_response

def test_parse_json_multi_file():
    content = '{"files": [{"file_path": "src/auth.py", "content": "def validate(): pass", "action": "CREATE"}], "test_files": [{"file_path": "tests/test_auth.py", "content": "def test_validate(): assert True"}], "commit_message": "feat: add auth"}'
    result = parse_code_response(content)
    assert "src/auth.py" in result
    assert "tests/test_auth.py" in result

def test_parse_json_with_markdown_fences():
    content = '```json\n{"files": [{"file_path": "app.py", "content": "print(1)", "action": "CREATE"}], "test_files": [], "commit_message": "init"}\n```'
    result = parse_code_response(content)
    assert "app.py" in result

def test_parse_markdown_code_blocks():
    content = '```python:src/utils.py\ndef helper():\n    return 42\n```\n\n```python:tests/test_utils.py\ndef test_helper():\n    assert helper() == 42\n```'
    result = parse_code_response(content)
    assert "src/utils.py" in result
    assert "tests/test_utils.py" in result

def test_fallback_raw_text():
    content = "just some raw code text that is not structured"
    result = parse_code_response(content)
    assert "generated_output.py" in result
    assert result["generated_output.py"] == content

def test_empty_content():
    result = parse_code_response("")
    assert "generated_output.py" in result
```

---

## STORY 2: P3-S2 — Local Test Runner Node + Bounded Retry Routing

**GitHub Issue**: `#13`
**Branch**: `feature/p3-s2-test-runner-and-retry-loop`
**Depends On**: P3-S1

### What to Build

#### 1. Create `shared/graph/test_runner.py` — Local (unsandboxed) test execution

```python
"""
Local test runner that executes generated test files in an isolated subprocess.
This is the UNSANDBOXED Part 3 implementation.
Part 5 will replace this with Firecracker/gVisor sandbox.
"""
import subprocess
import tempfile
import os
import shutil
from typing import Dict, Tuple

def run_tests_locally(generated_code: Dict[str, str], timeout_seconds: int = 60) -> Dict:
    """
    Write generated code to a temp directory, run pytest, capture results.
    Returns: {"passed": bool, "output": str, "traceback": str|None, "return_code": int}
    """
    tmpdir = tempfile.mkdtemp(prefix="devagents_sandbox_")
    try:
        # Write all generated files to temp directory
        for filepath, content in generated_code.items():
            full_path = os.path.join(tmpdir, filepath)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, "w") as f:
                f.write(content)

        # Find test files
        test_files = [f for f in generated_code.keys() if "test" in f.lower()]
        if not test_files:
            return {
                "passed": True,
                "output": "No test files found. Skipping test execution.",
                "traceback": None,
                "return_code": 0
            }

        # Run pytest in the temp directory
        result = subprocess.run(
            ["python", "-m", "pytest", "-v", "--tb=short", "--no-header", tmpdir],
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            cwd=tmpdir
        )

        passed = result.returncode == 0
        traceback = result.stderr if not passed else None
        output = result.stdout

        return {
            "passed": passed,
            "output": output[:5000],         # cap output size
            "traceback": traceback[:3000] if traceback else None,  # cap traceback
            "return_code": result.returncode
        }

    except subprocess.TimeoutExpired:
        return {
            "passed": False,
            "output": f"Test execution timed out after {timeout_seconds}s",
            "traceback": f"TimeoutError: test suite exceeded {timeout_seconds} second wall-clock limit",
            "return_code": -1
        }
    except Exception as e:
        return {
            "passed": False,
            "output": str(e),
            "traceback": str(e),
            "return_code": -1
        }
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)
```

#### 2. Add `test_runner_node` in `shared/graph/workflow.py`

```python
from shared.graph.test_runner import run_tests_locally

def test_runner_node(state: DevAgentState) -> dict:
    """Execute generated code tests in a local subprocess with timeout."""
    logs = list(state.get("logs", []))
    generated_code = state.get("generated_code") or {}

    if not generated_code:
        logs.append("Test runner: No generated code to test. Skipping.")
        return {"test_results": {"passed": True, "output": "No code to test", "traceback": None}, "logs": logs}

    logs.append(f"Test runner: executing tests for {len(generated_code)} generated files...")
    test_results = run_tests_locally(generated_code, timeout_seconds=60)

    if test_results["passed"]:
        logs.append(f"Test runner: ✅ ALL TESTS PASSED")
    else:
        logs.append(f"Test runner: ❌ TESTS FAILED (return_code={test_results['return_code']})")

    return {
        "test_results": test_results,
        "last_traceback": test_results.get("traceback"),
        "logs": logs
    }
```

#### 3. Add `route_test_results` router function in `shared/graph/workflow.py`

This is the deterministic router from the spec (`03_AGENT_FLOWS.md §5`):

```python
def route_test_results(state: DevAgentState) -> str:
    """Deterministic router: budget check → retry check → pass/fail routing."""
    # Budget gate
    if state.get("tokens_used", 0) >= state.get("token_budget", 100000):
        return "aborted"

    test_results = state.get("test_results") or {}
    if test_results.get("passed", False):
        return "end"  # tests passed → finish (will go to reviewer in Part 4)

    # Tests failed — check retry budget
    if state.get("retry_count", 0) < state.get("max_retries", 3):
        return "coder"  # retry
    return "aborted"    # retries exhausted
```

#### 4. Add `aborted_node` in `shared/graph/workflow.py`

```python
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
    return {"status": "aborted", "final_status": "aborted", "logs": logs, "error": reason}
```

#### 5. Update `create_agent_graph()` with the full self-healing loop

```python
def create_agent_graph(checkpointer=None):
    workflow = StateGraph(DevAgentState)

    # Register nodes
    workflow.add_node("planner", planner_node)
    workflow.add_node("human_review", human_review_node)
    workflow.add_node("coder", coder_node)
    workflow.add_node("test_runner", test_runner_node)
    workflow.add_node("aborted", aborted_node)

    # Entry point
    workflow.set_entry_point("planner")

    # Edges
    workflow.add_edge("planner", "human_review")
    workflow.add_conditional_edges(
        "human_review",
        route_after_human_review,
        {"coder": "coder", "planner": "planner"}
    )
    workflow.add_edge("coder", "test_runner")
    workflow.add_conditional_edges(
        "test_runner",
        route_test_results,
        {"coder": "coder", "end": END, "aborted": "aborted"}
    )
    workflow.add_edge("aborted", END)

    return workflow.compile(checkpointer=checkpointer)
```

#### 6. Update `celery_app.py` — save `generated_code` and `test_results` to checkpoint

After graph execution, persist `final_status` correctly based on graph result:

```python
# Update Task record with richer state
task.final_status = final_state.get("final_status") or final_state.get("status", "completed")
task.tokens_used = final_state.get("tokens_used", 0)
```

### Acceptance Criteria (P3-S2)
- [ ] `test_runner_node` executes generated tests in a subprocess with 60s timeout.
- [ ] `route_test_results` routes: passed → END, failed + retries left → coder, failed + no retries → aborted.
- [ ] Token budget breach → aborted (tested via low budget).
- [ ] Retry count correctly increments each loop (coder → test_runner → coder).
- [ ] `last_traceback` is populated with ONLY the failing test traceback (scoped context).
- [ ] Coder receives `last_traceback` on retry and attempts to fix the specific error.
- [ ] `aborted_node` records clear reason (budget or retries).
- [ ] Graph flow: `planner → human_review → coder → test_runner → (retry loop or END or aborted)`.
- [ ] All existing tests still pass.
- [ ] New test: `tests/test_retry_loop.py` verifying bounded retry behavior.

### Test File to Create: `tests/test_retry_loop.py`

```python
import pytest
from shared.graph.workflow import route_test_results

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
    assert route_test_results(state) == "coder"  # no results = not passed = retry
```

---

## Verification Commands (Run After Both Stories)

```bash
# Inside Docker:
docker compose exec api python -m pytest tests/ -v --tb=short

# Or locally if venv is active:
python -m pytest tests/ -v --tb=short

# Test the full flow via CLI:
python cli.py run "Create a Python function that validates email addresses and add unit tests"

# Check task status:
python cli.py status <task_id>

# Verify via API:
curl http://localhost:8005/tasks/list | python -m json.tool
```

---

## Git Workflow

```bash
# Story 1:
git checkout -b feature/p3-s1-code-agent-structured-output
# ... implement, test ...
git add -A
git commit -m "feat(P3-S1): expand DevAgentState + multi-file code parser + structured coder output"
git push origin feature/p3-s1-code-agent-structured-output
# Create PR → merge

# Story 2 (after P3-S1 merge):
git checkout main && git pull
git checkout -b feature/p3-s2-test-runner-and-retry-loop
# ... implement, test ...
git add -A
git commit -m "feat(P3-S2): local test runner node + bounded retry loop + route_test_results router"
git push origin feature/p3-s2-test-runner-and-retry-loop
# Create PR → merge
```

---

## Files Modified / Created Summary

### P3-S1:
| Action | File |
|--------|------|
| MODIFY | `shared/graph/state.py` |
| MODIFY | `shared/graph/prompts/coder.py` |
| MODIFY | `shared/graph/prompts/parser.py` (add `parse_code_response`) |
| MODIFY | `shared/graph/prompts/__init__.py` (export `parse_code_response`) |
| MODIFY | `shared/graph/workflow.py` (update `coder_node`) |
| MODIFY | `services/worker/celery_app.py` (update initial state) |
| NEW    | `tests/test_code_parser.py` |

### P3-S2:
| Action | File |
|--------|------|
| NEW    | `shared/graph/test_runner.py` |
| MODIFY | `shared/graph/workflow.py` (add `test_runner_node`, `route_test_results`, `aborted_node`, update graph) |
| NEW    | `tests/test_retry_loop.py` |
