"""
Local test runner that executes generated test files in an isolated subprocess.
This is the UNSANDBOXED Part 3 implementation.
Part 5 will replace this with Firecracker/gVisor microVM sandboxing.
"""
import subprocess
import tempfile
import os
import shutil
from typing import Dict

def run_tests_locally(generated_code: Dict[str, str], timeout_seconds: int = 60) -> Dict:
    """
    Write generated code to a temp directory, run pytest, capture results.
    Returns: {"passed": bool, "output": str, "traceback": str|None, "return_code": int}
    """
    if not generated_code:
        return {
            "passed": True,
            "output": "No generated code provided. Skipping test execution.",
            "traceback": None,
            "return_code": 0
        }

    tmpdir = tempfile.mkdtemp(prefix="devagents_sandbox_")
    try:
        # Write all generated files to temp directory
        for filepath, content in generated_code.items():
            # Sanitize path to prevent directory traversal
            clean_filepath = os.path.normpath(filepath).lstrip("/")
            if clean_filepath.startswith(".."):
                continue
            full_path = os.path.join(tmpdir, clean_filepath)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, "w") as f:
                f.write(content)

        # Find test files
        test_files = [f for f in generated_code.keys() if "test" in f.lower()]
        if not test_files:
            return {
                "passed": True,
                "output": "No test files found in generated output. Skipping test execution.",
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

        passed = (result.returncode == 0)
        output = result.stdout or ""
        traceback = result.stderr if not passed else None
        if not traceback and not passed:
            traceback = output

        return {
            "passed": passed,
            "output": output[:5000],
            "traceback": traceback[:3000] if traceback else None,
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
