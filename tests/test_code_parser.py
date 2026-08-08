import pytest
from shared.graph.prompts.parser import parse_code_response, parse_json_response

def test_parse_json_multi_file():
    content = '{"files": [{"file_path": "src/auth.py", "content": "def validate(): pass", "action": "CREATE"}], "test_files": [{"file_path": "tests/test_auth.py", "content": "def test_validate(): assert True"}], "commit_message": "feat: add auth"}'
    result = parse_code_response(content)
    assert "src/auth.py" in result
    assert "tests/test_auth.py" in result
    assert result["src/auth.py"] == "def validate(): pass"
    assert result["tests/test_auth.py"] == "def test_validate(): assert True"

def test_parse_json_with_markdown_fences():
    content = '```json\n{"files": [{"file_path": "app.py", "content": "print(1)", "action": "CREATE"}], "test_files": [], "commit_message": "init"}\n```'
    result = parse_code_response(content)
    assert "app.py" in result
    assert result["app.py"] == "print(1)"

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
    assert result["generated_output.py"] == ""

def test_parse_legacy_single_file_json():
    content = '{"file_path": "calculator.py", "code": "def add(a, b): return a + b", "test_file_path": "test_calculator.py", "test_code": "def test_add(): assert add(1, 2) == 3"}'
    result = parse_code_response(content)
    assert "calculator.py" in result
    assert "test_calculator.py" in result
    assert result["calculator.py"] == "def add(a, b): return a + b"
