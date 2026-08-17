import logging
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from backend.database.mongodb import get_database
from backend.services.auth import get_current_user
from backend.schemas.manager import ScenarioTemplateCreate, ScenarioTemplateResponse

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/", response_model=ScenarioTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_scenario_template(
    template_in: ScenarioTemplateCreate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Saves a training scenario configuration template in MongoDB."""
    template_id = str(uuid.uuid4())
    
    new_template = {
        "_id": template_id,
        "name": template_in.name,
        "industry": template_in.industry,
        "product": template_in.product,
        "issue_type": template_in.issue_type,
        "difficulty": template_in.difficulty,
        "customer_persona": template_in.customer_persona,
        "customer_mood": template_in.customer_mood,
        "goal": template_in.goal,
        "created_at": datetime.utcnow()
    }
    
    await db["scenarios"].insert_one(new_template)
    new_template["id"] = template_id
    return new_template

@router.get("/", response_model=list[ScenarioTemplateResponse])
async def list_scenario_templates(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Retrieves all reusable training scenario configuration templates."""
    cursor = db["scenarios"].find({}).sort("created_at", -1)
    templates = []
    async for doc in cursor:
        doc["id"] = doc["_id"]
        templates.append(doc)
    return templates
