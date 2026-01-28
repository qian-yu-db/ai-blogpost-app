from fastapi import APIRouter
from fastapi.responses import Response

from src.api.models.export import ExportRequest
from src.services.export_service import export_markdown, export_pdf

router = APIRouter()


@router.post("/markdown")
async def download_markdown(request: ExportRequest):
    """Download the blog post as a Markdown file."""
    content = export_markdown(request.content)
    filename = f"{request.title}.md"

    return Response(
        content=content,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/pdf")
async def download_pdf(request: ExportRequest):
    """Download the blog post as a PDF file."""
    pdf_bytes = export_pdf(request.content, request.title)
    filename = f"{request.title}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
