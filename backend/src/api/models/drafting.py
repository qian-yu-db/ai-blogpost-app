from pydantic import BaseModel


class DraftRequest(BaseModel):
    abstract: str
    personas: list[str]
    technical_level: str
    target_length: str
    style: str
    reference_urls: list[str] = []
    code_content: str = ""


class FeedbackRequest(BaseModel):
    content: str
    feedback_type: str = "comprehensive"


class Suggestion(BaseModel):
    type: str
    message: str
    line_start: int | None = None
    line_end: int | None = None
    original: str | None = None
    replacement: str | None = None


class FeedbackResponse(BaseModel):
    suggestions: list[Suggestion]
