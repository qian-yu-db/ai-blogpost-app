from pydantic import BaseModel


class ExportRequest(BaseModel):
    content: str
    title: str = "blog-post"


class StatsRequest(BaseModel):
    content: str


class StatsResponse(BaseModel):
    word_count: int
    character_count: int
    read_time_minutes: float
