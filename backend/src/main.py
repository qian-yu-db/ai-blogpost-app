from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import draft, feedback, files, export

app = FastAPI(title="AI Blog Post App", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(draft.router, prefix="/api/draft", tags=["draft"])
app.include_router(feedback.router, prefix="/api/feedback", tags=["feedback"])
app.include_router(export.router, prefix="/api/export", tags=["export"])


@app.get("/health")
def health_check():
    return {"status": "ok"}
