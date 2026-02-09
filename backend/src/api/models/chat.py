"""Pydantic models for chat/interactive mode (deprecated — use session models)."""

from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


class WorkflowPhase(str, Enum):
    PLANNING = "planning"
    DRAFTING = "drafting"
    REVIEWING = "reviewing"
    EXPORTING = "exporting"


class ChatMessageModel(BaseModel):
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


class ChatSessionResponse(BaseModel):
    session_id: str
    mode: str
    phase: WorkflowPhase
    messages: list[ChatMessageModel]
    planning_context: PlanningContextModel
    created_at: datetime
    updated_at: datetime


class StartChatRequest(BaseModel):
    topic_hint: str = ""


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    message_id: str
    content: str
    phase: WorkflowPhase
    planning_context: PlanningContextModel
