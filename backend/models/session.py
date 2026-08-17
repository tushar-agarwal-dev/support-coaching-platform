from datetime import datetime
from pydantic import BaseModel, Field
from backend.schemas.session import InteractionMode, DifficultyLevel, SessionStatus

class SessionInDB(BaseModel):
    id: str = Field(alias="_id")
    agent_id: str
    interaction_mode: InteractionMode
    industry: str
    product: str
    issue_type: str
    difficulty: DifficultyLevel
    customer_persona: str
    customer_mood: str
    status: SessionStatus = SessionStatus.ACTIVE
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        from_attributes = True
        arbitrary_types_allowed = True
