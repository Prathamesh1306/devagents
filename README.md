# DevAgents — Autonomous AI Software Engineering Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-OSS-black.svg)](https://github.com/langchain-ai/langgraph)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![Ollama](https://img.shields.io/badge/Ollama-Local-black.svg)](https://ollama.com)

**DevAgents** is a zero-architectural-flaw, self-hosted, multi-agent AI software engineering platform. It takes natural-language software engineering prompts or requirements and autonomously plans, codes, safety-reviews, tests, self-heals, and (with human approval) outputs fully-tested code with zero cloud dependencies.

> ⚡ **Zero API Keys Required**: Ships with local **Ollama (`llama3.1`)** running out of the box inside Docker Compose for $0.00 token cost. Optionally switchable to Google Gemini, OpenAI GPT-4o, or Anthropic Claude.

---

## ⚡ Quickstart — The 3-Command Setup

```bash
# 1. Clone the repository
git clone https://github.com/Prathamesh1306/devagents.git && cd devagents

# 2. Copy the zero-config environment file
cp .env.example .env

# 3. Spin up the entire platform (Postgres, Redis, Ollama, API, Worker, Web Dashboard)
docker compose up -d --build
```

- 🌐 **Web Mission Control UI**: Open [http://localhost:3000](http://localhost:3000)
- 🔌 **API Control Plane**: `http://localhost:8005/health`
- 🦙 **Local LLM**: Ollama auto-pulls `llama3.1` on first boot!

---

## 🌟 Key Platform Capabilities

- **🖥️ Web Mission Control Dashboard**: Real-time agent progress visualizer, interactive Human-in-the-Loop (HITL) plan reviewer, tabbed multi-file code inspector, sandbox test output, and live terminal log stream.
- **🔄 Bounded Self-Healing Coding Loop**: Autonomous iteration engine: `Planner → HITL Review → Coder → Safety Reviewer → Sandbox Test Runner → (Traceback Self-Healing Loop / Escalation)`.
- **🔒 Deterministic Safety Reviewer**: Pre-execution security and safety scanner catching blocked system calls and unanchored code before execution.
- **🚨 Human Escalation Engine**: When self-healing retries are exhausted (default: 3 retries), DevAgents cleanly escalates to senior engineers with full diagnostic tracebacks.
- **💰 PostgreSQL Cost & Token Ledger**: Real-time `llm_calls` table tracking prompt tokens, completion tokens, latency, and cost per graph node execution.

---

## 🏗 System Architecture & Directory Layout

```text
devagents/
├── services/
│   ├── api/                # FastAPI REST Control Plane (port 8005)
│   ├── worker/             # Celery background graph execution worker
│   ├── frontend/           # React + Vite + Tailwind Mission Control Dashboard (port 3000)
│   └── sandbox-runner/     # MicroVM / gVisor execution sandbox
├── shared/
│   ├── db/                 # SQLAlchemy ORM models (Task, LLMCall, Checkpoint)
│   ├── graph/              # LangGraph state machine, nodes, prompts, test_runner, reviewer
│   ├── llm/                # Multi-provider LLM abstraction (Ollama, Gemini, OpenAI, Claude, Stub)
│   └── migrations/         # Alembic database migration scripts
├── cli.py                  # Developer CLI tool (run, status, list)
└── docker-compose.yml      # Root multi-container orchestration stack
```

---

## 🗺 Implementation Roadmap & Status

| Part | Title | Status | GitHub Issues |
|---|---|---|---|
| **Part 1** | **Foundation & Scaffolding** | ✅ **Completed** | `#2`, `#3`, `#4`, `#5`, `#6` (CLOSED) |
| **Part 2** | **Real LLM Abstraction & Cost Ledger** | ✅ **Completed** | `#7`, `#8`, `#9`, `#10`, `#11` |
| **Part 3** | **Code Generation & Self-Healing Loop** | ✅ **Completed** | `#12`, `#13`, `#14`, `#15`, `#16` (CLOSED) |
| **Part 4** | **Review, Security & Escort Agents** | 🔄 **In Progress** | `#17` (CLOSED), `#18` – `#21` |
| **Part 5** | **Firecracker / gVisor Sandboxing** | ⏳ Planned | `#22` – `#26` |
| **Part 6** | **Observability & Immutable Audit Trail** | ⏳ Planned | `#27` – `#31` |
| **Part 7** | **Auth, RBAC & Single-Tenant Hardening** | ⏳ Planned | `#32` – `#36` |
| **Part 8** | **Multi-Tenancy (Postgres RLS & Isolation)** | ⏳ Planned | `#37` – `#42` |
| **Part 9** | **Guardrails & Secret Redaction** | ⏳ Planned | `#43` – `#47` |
| **Part 10** | **HA, Scale & Production K8s Deployment** | ⏳ Planned | `#48` – `#53` |
| **Part 11** | **Web Dashboard UI & Mission Control** | ✅ **Completed** | `#55`, `#56` (CLOSED), `#57` – `#58` |
| **Part 12** | **Enterprise AST Graph & Live WebSockets** | ⏳ Planned | `#59` – `#64` |
| **Part 13** | **Enterprise Security & Isolation** | ⏳ Planned | `#65` – `#69` |

---

## 📄 License
Released under the [MIT License](LICENSE).
