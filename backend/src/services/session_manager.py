"""Session manager for the agentic blog assistant."""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any
import uuid


class WorkflowPhase(str, Enum):
    PLANNING = "planning"
    DRAFTING = "drafting"
    REVIEWING = "reviewing"
    EXPORTING = "exporting"


@dataclass
class ChatMessage:
    id: str
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = field(default_factory=datetime.now)
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class PlanningContext:
    topic: str = ""
    abstract: str = ""
    personas: list[str] = field(default_factory=list)
    technical_level: str = "intermediate"
    target_length: str = "5"
    style: str = "tutorial"
    key_points: list[str] = field(default_factory=list)
    reference_urls: list[str] = field(default_factory=list)
    code_content: str = ""


@dataclass
class Session:
    session_id: str
    workflow_phase: WorkflowPhase = WorkflowPhase.PLANNING
    messages: list[ChatMessage] = field(default_factory=list)
    api_messages: list[dict] = field(default_factory=list)  # full Anthropic API messages
    planning_context: PlanningContext = field(default_factory=PlanningContext)
    draft_content: str = ""
    review_feedback: str = ""
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

    # Backward compat aliases
    @property
    def mode(self) -> str:
        return "interactive"

    @property
    def phase(self) -> WorkflowPhase:
        return self.workflow_phase


class SessionManager:
    """In-memory session storage."""

    def __init__(self):
        self._sessions: dict[str, Session] = {}

    def create_session(self, topic_hint: str = "") -> Session:
        session_id = str(uuid.uuid4())
        session = Session(session_id=session_id)
        if topic_hint:
            session.planning_context.topic = topic_hint
        self._sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Session | None:
        return self._sessions.get(session_id)

    def update_phase(self, session_id: str, phase: WorkflowPhase) -> Session | None:
        session = self._sessions.get(session_id)
        if not session:
            return None
        session.workflow_phase = phase
        session.updated_at = datetime.now()
        return session

    def update_session(
        self,
        session_id: str,
        phase: WorkflowPhase | None = None,
        planning_context: PlanningContext | None = None,
        draft_content: str | None = None,
        review_feedback: str | None = None,
    ) -> Session | None:
        session = self._sessions.get(session_id)
        if not session:
            return None

        if phase is not None:
            session.workflow_phase = phase
        if planning_context is not None:
            session.planning_context = planning_context
        if draft_content is not None:
            session.draft_content = draft_content
        if review_feedback is not None:
            session.review_feedback = review_feedback
        session.updated_at = datetime.now()
        return session

    def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        metadata: dict[str, Any] | None = None,
    ) -> ChatMessage | None:
        session = self._sessions.get(session_id)
        if not session:
            return None

        message = ChatMessage(
            id=str(uuid.uuid4()),
            role=role,
            content=content,
            metadata=metadata or {},
        )
        session.messages.append(message)
        session.updated_at = datetime.now()
        return message

    def add_api_messages(self, session_id: str, messages: list[dict]) -> bool:
        """Append raw Anthropic API format messages to session."""
        session = self._sessions.get(session_id)
        if not session:
            return False
        session.api_messages = list(messages)
        session.updated_at = datetime.now()
        return True

    def delete_session(self, session_id: str) -> bool:
        if session_id in self._sessions:
            del self._sessions[session_id]
            return True
        return False

    def get_conversation_history(self, session_id: str) -> list[dict]:
        """Get messages in Anthropic API format, preferring full API messages."""
        session = self._sessions.get(session_id)
        if not session:
            return []
        if session.api_messages:
            return list(session.api_messages)
        return [{"role": msg.role, "content": msg.content} for msg in session.messages]


# Global session manager instance
session_manager = SessionManager()
