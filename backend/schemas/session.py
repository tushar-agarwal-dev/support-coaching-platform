from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field

class InteractionMode(str, Enum):
    SIMULATOR = "simulator"
    MANUAL = "manual"
    REPLAY = "replay"

class DifficultyLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class SessionStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"

class TranscriptMessage(BaseModel):
    role: str
    content: str

class SessionCreate(BaseModel):
    interaction_mode: InteractionMode
    industry: str = Field(..., min_length=1)
    product: str = Field(..., min_length=1)
    issue_type: str = Field(..., min_length=1)
    difficulty: DifficultyLevel = DifficultyLevel.MEDIUM
    customer_persona: str = Field(..., min_length=1)
    customer_mood: str = Field(..., min_length=1)
    preloaded_transcript: list[TranscriptMessage] | None = None

class SessionResponse(SessionCreate):
    id: str
    agent_id: str
    status: SessionStatus
    created_at: datetime
    post_interaction_summary: dict | None = None
    replay_timeline: list[dict] | None = None

    class Config:
        from_attributes = True

class SessionUpdate(BaseModel):
    status: SessionStatus | None = None
