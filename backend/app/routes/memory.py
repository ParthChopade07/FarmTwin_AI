"""AI Farm Memory API Routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import FarmActivityCreate
from app.services.memory import get_farm_memory_context, log_farm_activity

router = APIRouter(prefix="/api/farms", tags=["AI Farm Memory"])


@router.get("/{farm_id}/memory")
def get_farm_memory(farm_id: str, days: int = 90, db: Session = Depends(get_db)):
    """Fetches synthesized farm memory history timeline."""
    return get_farm_memory_context(db, farm_id, days=days)


@router.post("/{farm_id}/activities")
def create_farm_activity(farm_id: str, activity_in: FarmActivityCreate, db: Session = Depends(get_db)):
    """Logs a new farm activity (irrigation, fertilization, spraying, etc.)."""
    act = log_farm_activity(
        db,
        farm_id=farm_id,
        activity_type=activity_in.activity_type,
        description=activity_in.description,
        amount=activity_in.amount,
        unit=activity_in.unit,
        activity_date=activity_in.activity_date
    )
    return {
        "status": "success",
        "activity_id": str(act.id),
        "activity_type": act.activity_type,
        "description": act.description,
        "activity_date": act.activity_date.isoformat() if act.activity_date else None
    }
