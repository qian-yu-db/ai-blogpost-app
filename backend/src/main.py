from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import draft, feedback, files, export, chat
from src.api.routes import session

app = FastAPI(title="AI Blog Post App", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# New agentic session API
app.include_router(session.router, prefix="/api/session", tags=["session"])

# Existing routes (kept for backward compat)
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(draft.router, prefix="/api/draft", tags=["draft"])
app.include_router(feedback.router, prefix="/api/feedback", tags=["feedback"])
app.include_router(export.router, prefix="/api/export", tags=["export"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])


@app.get("/health")
def health_check():
    return {"status": "ok", "agent_sdk": True, "version": "0.2.0"}
