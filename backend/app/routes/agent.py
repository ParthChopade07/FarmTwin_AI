"""FastAPI route for AgriTwin Autonomous Agentic AI.

POST /api/agent/run
Body: {"farm_id": "...", "goal": "Run 360-degree farm health audit", "language": "en"}
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.orm import Farm
from app.services import farm_health_agent

router = APIRouter(prefix="/api/agent", tags=["agent"])


class AgentRunRequest(BaseModel):
    farm_id: str
    goal: str = "Run 360-degree farm health & disease protection audit"
    language: str = "en"


@router.post("/run")
def run_autonomous_agent(payload: AgentRunRequest, db: Session = Depends(get_db)):
    """Run autonomous agent loop to investigate farm health and return action plan."""
    farm = db.query(Farm).filter(Farm.id == payload.farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    result = farm_health_agent.run_farm_health_agent(
        db=db,
        farm_id=payload.farm_id,
        goal=payload.goal,
        language=payload.language
    )
    return result
