# DevAgents — Production & Enterprise Grade Multi-Agent Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-OSS-black.svg)](https://github.com/langchain-ai/langgraph)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)

**DevAgents** is a zero-architectural-flaw, self-hosted, multi-agent AI software engineering platform. It takes a natural-language requirement or GitHub issue and autonomously plans, codes, tests, self-heals, reviews, documents, and (with human approval) ships a pull request with full auditability, multi-tenant isolation, and zero-trust security.

### 🌟 Key Platform Capabilities
- **Interactive & Event-Driven Tasks**: Submit requirements via CLI, Web UI, Slack, or GitHub Webhooks.
- **🌙 Autonomous Nightly Scanner Agent**: Connect DevAgents to any repository to run scheduled background scans (e.g., midnight cron jobs or `autofix` issue labels). It autonomously triages open issues, fixes failing tests, verifies solutions in MicroVM sandboxes, and opens ready-to-merge Pull Requests before developers arrive in the morning!
- **🔒 Dedicated Multi-Tenant Isolation**: Hard isolation at PostgreSQL RLS, vector DB namespaces, and worker queue layers so every organization/enterprise has their own isolated DevAgent environment.

---

## 🏗 System Architecture & Monorepo Structure

```text
devagents/
├── services/
│   ├── api/                # FastAPI REST Control Plane (stateless)
│   ├── worker/             # Celery + Redis background task worker
│   └── sandbox-runner/     # MicroVM / gVisor isolated execution environment (Part 5)
├── shared/
│   ├── db/                 # SQLAlchemy 2.0 ORM models (Task, Checkpoint, etc.)
│   ├── graph/              # LangGraph orchestration state & compiled graph workflows
│   └── migrations/         # Alembic database migration scripts
├── infra/                  # Infrastructure configurations & Docker Compose definitions
├── cli.py                  # Local developer CLI tool for task creation & status polling
├── docker-compose.yml      # Root orchestration stack
└── alembic.ini             # Database migration configuration
```

---

## ⚙️ Environment & Configuration Setup

DevAgents is designed to run seamlessly either with the bundled local Docker infrastructure or with cloud database providers like **Supabase PostgreSQL** and **Upstash Redis**.

### `.env` File Example

```env
# Database Configuration (Local PostgreSQL or Supabase)
POSTGRES_USER=devagents
POSTGRES_PASSWORD=devagents_pass
POSTGRES_DB=devagents_db
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Database Connection String
# For Local Docker:
DATABASE_URL=postgresql://devagents:devagents_pass@postgres:5432/devagents_db
# For Supabase PostgreSQL (Direct or Connection Pooler):
# DATABASE_URL=postgresql://postgres.[project_ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require

# Redis & Task Queue Configuration (Local Redis or Upstash)
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/1

# API Server Settings
API_HOST=0.0.0.0
API_PORT=8000
API_URL=http://localhost:8005
```

> [!TIP]
> **Using Supabase & Remote Redis:**
> Simply replace `DATABASE_URL` with your Supabase connection string (`postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres?sslmode=require`) and update `CELERY_BROKER_URL` with your Redis connection string. No code changes required!

---

## 🚀 Quickstart Guide

### 1. Launch Services via Docker Compose
```bash
docker compose up -d --build
```

### 2. Apply Database Migrations
```bash
docker compose exec api alembic upgrade head
```

### 3. Verify System Health
```bash
curl http://localhost:8005/health
```
*Response:* `{"status": "ok", "service": "devagents-api"}`

### 4. Execute a Task via CLI
```bash
python3 cli.py run "Create user authentication API endpoint"
```

### 5. Check Task Status
```bash
python3 cli.py status <task_id>
```

---

## 📡 API Reference Specifications

### `POST /tasks`
Submits a new task for autonomous execution.

- **Request Body:**
```json
{
  "task_prompt": "Implement input validation on the /signup endpoint",
  "token_budget": 100000,
  "source": "api"
}
```
- **Response (201 Created):**
```json
{
  "id": "4a8f1e8b-b0d0-4e50-bb5c-7a8b414275ab",
  "task_prompt": "Implement input validation on the /signup endpoint",
  "final_status": "pending",
  "token_budget": 100000,
  "tokens_used": 0,
  "trace_id": "trace-050b3695a9b7",
  "created_at": "2026-08-07T21:29:27.914405+00:00",
  "updated_at": "2026-08-07T21:29:27.914405+00:00"
}
```

### `GET /tasks/{task_id}`
Retrieves current task state, status, token usage, and trace details.

---

## 🗺 Implementation Roadmap & Status

| Part | Title | Status | Issues |
|---|---|---|---|
| **Part 1** | **Foundation & Scaffolding** | ✅ **Completed** | `#2`, `#3`, `#4`, `#5`, `#6` (CLOSED) |
| **Part 2** | **Real LLM Integration & Planning Agent** | ⏳ Planned | `#7` – `#11` |
| **Part 3** | **Code Generation Loop (No Sandbox Yet)** | ⏳ Planned | `#12` – `#16` |
| **Part 4** | **Review, Security & Doc Agents (Complete Happy Path)** | ⏳ Planned | `#17` – `#21` |
| **Part 5** | **Real Sandboxing (Firecracker / gVisor)** | ⏳ Planned | `#22` – `#26` |
| **Part 6** | **Observability & Immutable Audit Trail** | ⏳ Planned | `#27` – `#31` |
| **Part 7** | **Auth, RBAC & Single-Tenant Hardening** | ⏳ Planned | `#32` – `#36` |
| **Part 8** | **Multi-Tenancy (Postgres RLS & Isolation)** | ⏳ Planned | `#37` – `#42` |
| **Part 9** | **Guardrails, Secret Redaction & Compliance** | ⏳ Planned | `#43` – `#47` |
| **Part 10** | **HA, Scale & Production K8s Deployment** | ⏳ Planned | `#48` – `#53` |
| **Part 11** | **Web Dashboard UI, SSO & SaaS Monetization (Stripe)** | ⏳ Planned | `#55` – `#58` |

---

## 📄 License
Released under the [MIT License](LICENSE).
