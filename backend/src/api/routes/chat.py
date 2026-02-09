"""Chat/interactive mode API routes (deprecated — use /api/session instead)."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from src.api.models.chat import (
    ChatRequest,
    ChatSessionResponse,
    ChatMessageModel,
    PlanningContextModel,
    StartChatRequest,
)
from src.services.session_manager import session_manager
from src.services.agent_service import run_agentic_session, generate_from_session

router = APIRouter()


def session_to_response(session) -> ChatSessionResponse:
    """Convert internal Session to API response model."""
    return ChatSessionResponse(
        session_id=session.session_id,
        mode=session.mode,
        phase=session.workflow_phase,
        messages=[
            ChatMessageModel(
                id=msg.id,
                role=msg.role,
                content=msg.content,
                timestamp=msg.timestamp,
                metadata=msg.metadata,
            )
            for msg in session.messages
        ],
        planning_context=PlanningContextModel(
            topic=session.planning_context.topic,
            abstract=session.planning_context.abstract,
            personas=session.planning_context.personas,
            technical_level=session.planning_context.technical_level,
            target_length=session.planning_context.target_length,
            style=session.planning_context.style,
            key_points=session.planning_context.key_points,
            reference_urls=session.planning_context.reference_urls,
            code_content=session.planning_context.code_content,
        ),
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


@router.post("/start")
async def start_chat_session(request: StartChatRequest) -> ChatSessionResponse:
    """Start a new interactive chat session. Deprecated: use POST /api/session/start."""
    session = session_manager.create_session(topic_hint=request.topic_hint)
    return session_to_response(session)


@router.get("/session/{session_id}")
async def get_session(session_id: str) -> ChatSessionResponse:
    """Get current session state. Deprecated: use GET /api/session/{id}."""
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session_to_response(session)


@router.post("/message/{session_id}")
async def send_message(session_id: str, request: ChatRequest):
    """Send a message and stream the response. Deprecated: use POST /api/session/{id}/message."""
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    async def event_stream():
        async for event in run_agentic_session(session_id, request.message):
            yield event

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/generate/{session_id}")
async def generate_draft_from_session(session_id: str):
    """Generate a draft from the session. Deprecated: use POST /api/session/{id}/message."""
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    async def event_stream():
        async for event in generate_from_session(session_id):
            yield event

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Delete a chat session. Deprecated: use DELETE /api/session/{id}."""
    if not session_manager.delete_session(session_id):
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "deleted"}
