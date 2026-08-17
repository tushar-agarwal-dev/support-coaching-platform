from fastapi import APIRouter, Depends
from backend.services.auth import get_current_user
from backend.schemas.user import UserResponse

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    """Fetch the profile of the currently logged-in user."""
    return current_user
