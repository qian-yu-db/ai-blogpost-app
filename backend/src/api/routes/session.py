"""Session-based agentic API routes."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from src.api.models.session import (
    StartSessionRequest,
    SessionMessageRequest,
    TransitionRequest,
    SessionResponse,
    SessionMessageModel,
    PlanningContextModel,
)
from src.services.session_manager import session_manager, WorkflowPhase
from src.services.agent_service import run_agentic_session, generate_from_session

router = APIRouter()


def session_to_response(session) -> SessionResponse:
    """Convert internal Session to API response model."""
    return SessionResponse(
        session_id=session.session_id,
        workflow_phase=session.workflow_phase,
        messages=[
            SessionMessageModel(
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
        draft_content=session.draft_content,
        review_feedback=session.review_feedback,
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


@router.post("/start")
async def start_session(request: StartSessionRequest) -> SessionResponse:
    """Create a new session and return its state."""
    session = session_manager.create_session(topic_hint=request.topic_hint)
    return session_to_response(session)


@router.get("/{session_id}")
async def get_session(session_id: str) -> SessionResponse:
    """Get current session state."""
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session_to_response(session)


@router.post("/{session_id}/message")
async def send_message(session_id: str, request: SessionMessageRequest):
    """Send a user message and stream the agentic response as SSE."""
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    async def event_stream():
        async for event in run_agentic_session(session_id, request.message):
            yield event

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/{session_id}/transition")
async def transition_phase(session_id: str, request: TransitionRequest) -> SessionResponse:
    """Move the session to a new workflow phase."""
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    target = WorkflowPhase(request.target_phase.value)
    session_manager.update_phase(session_id, target)

    # If transitioning to drafting, trigger draft generation
    if target == WorkflowPhase.DRAFTING:
        # Return the updated session — client should call /message to generate
        pass

    session = session_manager.get_session(session_id)
    return session_to_response(session)


@router.delete("/{session_id}")
async def delete_session(session_id: str):
    """Delete a session."""
    if not session_manager.delete_session(session_id):
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "deleted"}
