#!/usr/bin/env python3
import sys
import os
import time
import json
import argparse
import urllib.request
import urllib.error

API_URL = os.getenv("API_URL", "http://localhost:8005")

def make_request(url: str, method: str = "GET", data: dict = None) -> dict:
    req = urllib.request.Request(url, method=method)
    req.add_header("Content-Type", "application/json")
    
    body = json.dumps(data).encode("utf-8") if data else None
    try:
        with urllib.request.urlopen(req, data=body) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        print(f"HTTP Error {e.code}: {err_msg}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"Network Error: Could not connect to API at {API_URL}. Is docker container running? ({e.reason})", file=sys.stderr)
        sys.exit(1)

def run_task(prompt: str, token_budget: int = 100000):
    print(f"🚀 Submitting task to DevAgents Control Plane ({API_URL})...")
    print(f"   Prompt: '{prompt}'")
    
    payload = {"task_prompt": prompt, "token_budget": token_budget, "source": "cli"}
    res = make_request(f"{API_URL}/tasks", method="POST", data=payload)
    
    task_id = res["id"]
    trace_id = res.get("trace_id", "N/A")
    print(f"✅ Task created successfully!")
    print(f"   Task ID:  {task_id}")
    print(f"   Trace ID: {trace_id}")
    print(f"   Status:   {res['final_status']}\n")
    
    print("⏳ Polling graph execution status...")
    start_time = time.time()
    
    while True:
        status_res = make_request(f"{API_URL}/tasks/{task_id}")
        current_status = status_res["final_status"]
        
        if current_status not in ["pending", "running"]:
            elapsed = time.time() - start_time
            print(f"\n🎉 Task completed with status: [{current_status.upper()}] in {elapsed:.2f}s")
            print(f"   Tokens Used: {status_res.get('tokens_used', 0)}")
            print(f"   Updated At:  {status_res.get('updated_at', '')}")
            break
            
        print(".", end="", flush=True)
        time.sleep(1)

def get_status(task_id: str):
    res = make_request(f"{API_URL}/tasks/{task_id}")
    print(json.dumps(res, indent=2))

def main():
    parser = argparse.ArgumentParser(description="DevAgents CLI Tool")
    subparsers = parser.add_subparsers(dest="command")

    # 'run' command
    run_parser = subparsers.add_parser("run", help="Run a new task prompt")
    run_parser.add_argument("prompt", type=str, help="Task prompt requirement")
    run_parser.add_argument("--budget", type=int, default=100000, help="Token budget")

    # 'status' command
    status_parser = subparsers.add_parser("status", help="Get status of a task by ID")
    status_parser.add_argument("task_id", type=str, help="Task UUID")

    args = parser.parse_args()

    if args.command == "run":
        run_task(args.prompt, args.budget)
    elif args.command == "status":
        get_status(args.task_id)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
