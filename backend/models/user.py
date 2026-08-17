from datetime import datetime
from pydantic import BaseModel, Field
from backend.schemas.user import UserRole

class UserInDB(BaseModel):
    id: str = Field(alias="_id")
    email: str
    hashed_password: str
    full_name: str
    role: UserRole = UserRole.AGENT
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
