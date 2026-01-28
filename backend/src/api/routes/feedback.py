from fastapi import APIRouter

from src.api.models.drafting import FeedbackRequest, FeedbackResponse, Suggestion
from src.services.agent_service import get_feedback

router = APIRouter()


@router.post("/review", response_model=FeedbackResponse)
async def review_draft(request: FeedbackRequest):
    """Get suggestions for a draft."""
    suggestions_data = await get_feedback(request.content, request.feedback_type)
    suggestions = [Suggestion(**s) for s in suggestions_data]
    return FeedbackResponse(suggestions=suggestions)
