import logging
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from backend.database.mongodb import get_database
from backend.services.auth import get_current_user
from backend.agents.customer_simulator import generate_customer_response
from backend.agents.knowledge_recommender import knowledge_recommender_node

logger = logging.getLogger(__name__)
router = APIRouter()

class SimulatorTriggerRequest(BaseModel):
    session_id: str
    latest_agent_message: str

@router.post("/message", status_code=status.HTTP_200_OK)
async def manual_simulator_trigger(
    req: SimulatorTriggerRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Manually triggers the simulated customer response outside of the default stategraph workflow."""
    session = await db["sessions"].find_one({"_id": req.session_id})
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session configuration not found"
        )
        
    history = session.get("history", [])
    current_mood = session.get("current_mood", session["customer_mood"])
    frustration_score = session.get("frustration_score", 3.0)
    escalation_level = session.get("escalation_level", 0)

    customer_response = generate_customer_response(
        session_config=session,
        history=history,
        latest_agent_msg=req.latest_agent_message,
        current_mood=current_mood,
        frustration_score=frustration_score,
        escalation_level=escalation_level
    )
    
    return {
        "message": customer_response.message,
        "current_mood": customer_response.current_mood,
        "frustration_score": customer_response.frustration_score,
        "escalation_level": customer_response.escalation_level
    }

@router.get("/knowledge/retrieve", status_code=status.HTTP_200_OK)
async def standalone_knowledge_retrieve(
    query: str,
    current_user: dict = Depends(get_current_user)
):
    """Stand-alone retrieval endpoint matching input query to vector store chunks."""
    if not query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query parameter is required"
        )
        
    state = {
        "latest_message": {"role": "agent", "content": query},
        "retrieved_knowledge": []
    }
    
    result = knowledge_recommender_node(state)
    return {
        "query": query,
        "recommendations": result.get("retrieved_knowledge", [])
    }
