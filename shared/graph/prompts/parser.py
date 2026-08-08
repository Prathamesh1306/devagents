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
