from pydantic import BaseModel


class PlanningInput(BaseModel):
    abstract: str
    personas: list[str]
    technical_level: str
    target_length: str
    style: str
    reference_urls: list[str] = []
    uploaded_file_ids: list[str] = []
