"""Pydantic models for the session-based agentic API."""

from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


class WorkflowPhase(str, Enum):
    PLANNING = "planning"
    DRAFTING = "drafting"
    REVIEWING = "reviewing"
    EXPORTING = "exporting"


class SessionMessageModel(BaseModel):
    id: str
    role: str
    content: str
    timestamp: datetime
    metadata: dict = Field(default_factory=dict)


class PlanningContextModel(BaseModel):
    topic: str = ""
    abstract: str = ""
    personas: list[str] = Field(default_factory=list)
    technical_level: str = "intermediate"
    target_length: str = "5"
    style: str = "tutorial"
    key_points: list[str] = Field(default_factory=list)
    reference_urls: list[str] = Field(default_factory=list)
    code_content: str = ""


class StartSessionRequest(BaseModel):
    topic_hint: str = ""


class SessionMessageRequest(BaseModel):
    message: str


class TransitionRequest(BaseModel):
    target_phase: WorkflowPhase


class SessionResponse(BaseModel):
    session_id: str
    workflow_phase: WorkflowPhase
    messages: list[SessionMessageModel]
    planning_context: PlanningContextModel
    draft_content: str = ""
    review_feedback: str = ""
    created_at: datetime
    updated_at: datetime
