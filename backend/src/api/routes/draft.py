from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from src.api.models.drafting import DraftRequest
from src.api.models.export import StatsRequest, StatsResponse
from src.services.agent_service import stream_draft
from src.utils.word_count import calculate_stats

router = APIRouter()


@router.post("/generate")
async def generate_draft(request: DraftRequest):
    """Generate a blog post draft with SSE streaming."""

    async def generate():
        async for chunk in stream_draft(
            abstract=request.abstract,
            personas=request.personas,
            technical_level=request.technical_level,
            target_length=request.target_length,
            style=request.style,
            code_content=request.code_content,
            reference_urls=request.reference_urls,
        ):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.post("/stats", response_model=StatsResponse)
async def get_stats(request: StatsRequest):
    """Calculate statistics for draft content."""
    stats = calculate_stats(request.content)
    return StatsResponse(**stats)
