import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from backend.database.mongodb import get_database
from backend.schemas.session import SessionCreate, SessionResponse, SessionUpdate, SessionStatus
from backend.services.auth import get_current_user, RoleChecker
from backend.schemas.user import UserRole

router = APIRouter()

@router.post("/", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    session_in: SessionCreate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Creates a new coaching session configuration stored in MongoDB."""
    session_id = str(uuid.uuid4())
    
    new_session = {
        "_id": session_id,
        "agent_id": current_user["id"],
        "interaction_mode": session_in.interaction_mode,
        "industry": session_in.industry,
        "product": session_in.product,
        "issue_type": session_in.issue_type,
        "difficulty": session_in.difficulty,
        "customer_persona": session_in.customer_persona,
        "customer_mood": session_in.customer_mood,
        "preloaded_transcript": [m.dict() for m in session_in.preloaded_transcript] if session_in.preloaded_transcript else None,
        "status": SessionStatus.ACTIVE,
        "created_at": datetime.utcnow()
    }
    
    await db["sessions"].insert_one(new_session)
    new_session["id"] = session_id
    return new_session

@router.get("/", response_model=list[SessionResponse])
async def list_sessions(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Lists coaching sessions. Agents see their own; managers and admins see all."""
    query = {}
    if current_user["role"] == UserRole.AGENT:
        query["agent_id"] = current_user["id"]
        
    cursor = db["sessions"].find(query).sort("created_at", -1)
    sessions = []
    async for doc in cursor:
        doc["id"] = doc["_id"]
        sessions.append(doc)
    return sessions

@router.patch("/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: str,
    session_update: SessionUpdate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Updates a coaching session (e.g. marking it as completed)."""
    session = await db["sessions"].find_one({"_id": session_id})
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Restrict modifying session to the owner (agent) or managers/admins
    if current_user["role"] == UserRole.AGENT and session["agent_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to update this session."
        )
        
    update_data = {k: v for k, v in session_update.dict(exclude_unset=True).items()}
    if update_data:
        if update_data.get("status") == SessionStatus.COMPLETED:
            from backend.agents.summary_agent import generate_post_interaction_summary
            summary = generate_post_interaction_summary(session.get("history", []))
            update_data["post_interaction_summary"] = summary.dict()
            
        await db["sessions"].update_one({"_id": session_id}, {"$set": update_data})
        session.update(update_data)
        
    session["id"] = session["_id"]
    return session
