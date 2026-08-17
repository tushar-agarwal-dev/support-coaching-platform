from datetime import datetime
from enum import Enum
from pydantic import BaseModel, EmailStr, Field

class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    AGENT = "agent"

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.AGENT

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserResponse(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: str | None = None
    role: UserRole | None = None
    password: str | None = None
