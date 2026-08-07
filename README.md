# DevAgents — Multi-Agent Software Engineering Platform

Zero-Architectural-Flaw, Production & Enterprise Grade Multi-Agent Platform.

## Part 1 — Foundation & Scaffolding

### Architecture & Components
- **API Control Plane**: FastAPI REST application (`services/api`)
- **Worker**: Celery background execution worker (`services/worker`)
- **Orchestration**: LangGraph 2-node graph with PostgreSQL Checkpointer (`shared/graph`)
- **Database & Migrations**: PostgreSQL + SQLAlchemy + Alembic (`shared/db`)
- **CLI**: Local command-line tool for task creation & status polling (`cli.py`)

### Quickstart

1. Start services with Docker Compose:
```bash
docker compose up -d --build
```

2. Run DB migrations:
```bash
docker compose exec api alembic upgrade head
```

3. Run a test task via CLI:
```bash
python3 cli.py run "Create user auth endpoint"
```
