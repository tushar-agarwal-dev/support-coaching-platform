from datetime import datetime
from enum import Enum
from pydantic import BaseModel

class DocumentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class DocumentResponse(BaseModel):
    id: str
    name: str
    file_type: str
    status: DocumentStatus
    chunk_count: int
    file_size: int
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentDetailResponse(DocumentResponse):
    metadata: dict | None = None
