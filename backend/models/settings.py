from datetime import datetime
from pydantic import BaseModel, Field

class SystemSettings(BaseModel):
    id: str = Field("default", alias="_id")
    system_name: str = "Customer Support Coaching Platform"
    default_difficulty: str = "medium"
    allowed_domains: list[str] = Field(default_factory=list)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
