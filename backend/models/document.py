from datetime import datetime
from pydantic import BaseModel, Field
from backend.schemas.document import DocumentStatus

class DocumentInDB(BaseModel):
    id: str = Field(alias="_id")
    name: str
    file_type: str
    status: DocumentStatus = DocumentStatus.PENDING
    chunk_count: int = 0
    file_size: int
    chroma_ids: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        from_attributes = True
