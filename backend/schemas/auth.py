from pydantic import BaseModel
from backend.schemas.user import UserRole

class Token(BaseModel):
    access_token: str
    token_type: str
    role: UserRole
    email: str
    full_name: str

class TokenData(BaseModel):
    email: str | None = None
    role: UserRole | None = None
