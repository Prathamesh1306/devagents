"""
Deterministic code reviewer node — runs before test execution.
Checks: import safety, obvious dangerous patterns, test presence.
No LLM call required. Pure Python rule-based review.
"""
from typing import Dict, List

BLOCKED_PATTERNS = [
    "os.system",
    "subprocess.call(",
    "eval(",
    "exec(",
    "__import__",
    "shutil.rmtree('/'",
]

def review_generated_code(generated_code: Dict[str, str]) -> Dict:
    """
    Evaluates generated code against deterministic safety and sanity rules.
    Returns: {"passed": bool, "findings": List[Dict]}
    """
    if not generated_code:
        return {"passed": True, "findings": []}

    findings: List[Dict] = []
    has_test_function = False

    for filepath, content in generated_code.items():
        # Check for dangerous / blocked patterns
        for pattern in BLOCKED_PATTERNS:
            if pattern in content:
                findings.append({
                    "file": filepath,
                    "issue": f"Blocked security pattern detected: '{pattern}'",
                    "severity": "high"
                })

        # Check for test presence in test files
        if "test" in filepath.lower():
            if "def test_" in content or "class Test" in content:
                has_test_function = True
            else:
                findings.append({
                    "file": filepath,
                    "issue": "Test file created but contains no test functions (def test_*)",
                    "severity": "medium"
                })

    has_high_severity = any(f["severity"] == "high" for f in findings)
    passed = not has_high_severity

    return {
        "passed": passed,
        "findings": findings,
        "has_tests": has_test_function
    }
