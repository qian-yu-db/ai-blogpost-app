import uuid
from pathlib import Path

from fastapi import APIRouter, UploadFile, HTTPException

from src.config import UPLOADS_DIR
from src.utils.file_parser import parse_file

router = APIRouter()


@router.post("/upload")
async def upload_file(file: UploadFile):
    """Upload a .py or .ipynb file and parse its content."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    suffix = Path(file.filename).suffix.lower()
    if suffix not in [".py", ".ipynb"]:
        raise HTTPException(
            status_code=400, detail="Only .py and .ipynb files are supported"
        )

    file_id = str(uuid.uuid4())
    file_path = UPLOADS_DIR / f"{file_id}{suffix}"

    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    content = await file.read()
    file_path.write_bytes(content)

    parsed_content = parse_file(file_path)

    return {
        "id": file_id,
        "filename": file.filename,
        "content": parsed_content,
    }


@router.get("/{file_id}")
async def get_file(file_id: str):
    """Get a previously uploaded file's content."""
    for suffix in [".py", ".ipynb"]:
        file_path = UPLOADS_DIR / f"{file_id}{suffix}"
        if file_path.exists():
            return {
                "id": file_id,
                "content": parse_file(file_path),
            }

    raise HTTPException(status_code=404, detail="File not found")
