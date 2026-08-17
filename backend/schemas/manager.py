from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class FAQStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class ScenarioTemplateCreate(BaseModel):
    name: str = Field(..., min_length=1)
    industry: str = Field(..., min_length=1)
    product: str = Field(..., min_length=1)
    issue_type: str = Field(..., min_length=1)
    difficulty: str = Field(..., min_length=1)
    customer_persona: str = Field(..., min_length=1)
    customer_mood: str = Field(..., min_length=1)
    goal: str = Field(..., min_length=1)

class ScenarioTemplateResponse(ScenarioTemplateCreate):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class FAQDraftCreate(BaseModel):
    question: str = Field(..., min_length=1)
    answer: str = Field(..., min_length=1)
    policy: str = Field(..., min_length=1)

class FAQDraftResponse(FAQDraftCreate):
    id: str
    gap_id: str
    status: FAQStatus
    created_at: datetime

    class Config:
        from_attributes = True

class KnowledgeGapResponse(BaseModel):
    id: str
    question: str
    intent: str
    similarity_score: float
    timestamp: datetime
    frequency: int

    class Config:
        from_attributes = True

class TrendPoint(BaseModel):
    date: str
    avg_satisfaction: float
    avg_compliance: float
    avg_latency: float

class EscalationTrigger(BaseModel):
    intent: str
    count: int
    avg_frustration: float

class AgentProgression(BaseModel):
    agent_name: str
    initial_score: float
    current_score: float
    delta: float

class HistoricalTrendsResponse(BaseModel):
    trend_points: list[TrendPoint]
    escalation_triggers: list[EscalationTrigger]
    agent_progressions: list[AgentProgression]
