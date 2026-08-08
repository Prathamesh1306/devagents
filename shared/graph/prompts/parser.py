import json
from typing import Dict, Any

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

def parse_code_response(content: str) -> Dict[str, str]:
    """
    Parse LLM coder output into {filepath: content} dict.
    Handles: JSON format (both multi-file and single-file), markdown code blocks with filenames, and raw text fallback.
    Returns dict of {filepath: file_content}.
    """
    if not content or not content.strip():
        return {"generated_output.py": ""}

    # Strategy 1: Try JSON parse first
    parsed = parse_json_response(content)
    if isinstance(parsed, dict) and "error" not in parsed:
        result = {}
        if "files" in parsed:
            for f in parsed["files"]:
                if isinstance(f, dict) and "file_path" in f and "content" in f:
                    result[f["file_path"]] = f["content"]
            for f in parsed.get("test_files", []):
                if isinstance(f, dict) and "file_path" in f and "content" in f:
                    result[f["file_path"]] = f["content"]
            if result:
                return result

        # Legacy single-file structure fallback
        if "file_path" in parsed and "code" in parsed:
            result[parsed["file_path"]] = parsed["code"]
            if "test_file_path" in parsed and "test_code" in parsed:
                result[parsed["test_file_path"]] = parsed["test_code"]
            return result

    # Strategy 2: Try markdown code blocks with filenames
    # Pattern: ```python:path/to/file.py or ```path/to/file.py
    import re
    pattern = r'```[\w]*:?([\w/._-]+)\n(.*?)```'
    matches = re.findall(pattern, content, re.DOTALL)
    if matches:
        return {filepath.strip(): code.strip() for filepath, code in matches if filepath.strip()}

    # Strategy 3: Fallback — return raw content as single file
    return {"generated_output.py": content}

