import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.api.routes.tasks import router as tasks_router

app = FastAPI(
    title="DevAgents Control Plane API",
    description="Multi-Agent Software Engineering Platform API",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks_router)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "devagents-api"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("API_PORT", 8000))
    host = os.getenv("API_HOST", "0.0.0.0")
    uvicorn.run("services.api.main:app", host=host, port=port, reload=True)
