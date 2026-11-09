"""AI Farm Memory Service for AgriTwin.

This service records, maintains, and synthesizes farm memory context:
- Historical crop cycles & past disease occurrences
- Rainfall & irrigation history (e.g. last irrigated 3 days ago, 500L/acre)
- Fertilizer & nutrient treatment history
- Farmer preferences and yield records

This memory context is automatically injected into AI Assistant Q&A and 
recommendation engines to deliver personalized advisory.
"""
from datetime import datetime, timedelta
from typing import Dict, List, Any
from sqlalchemy.orm import Session

from app.models.orm import Farm, FarmActivity, FarmMemoryLog, DiseaseScan, SatelliteObservation, Weather


def log_farm_activity(
    db: Session,
    farm_id: str,
    activity_type: str,
    description: str,
    amount: float = None,
    unit: str = None,
    activity_date: datetime = None
) -> FarmActivity:
    """Logs a new farm activity (irrigation, fertilizer, spraying, etc.)."""
    activity = FarmActivity(
        farm_id=farm_id,
        activity_type=activity_type,
        description=description,
        amount=amount,
        unit=unit,
        activity_date=activity_date or datetime.utcnow().date()
    )
    db.add(activity)

    # Automatically add a structured memory log entry
    memory_entry = FarmMemoryLog(
        farm_id=farm_id,
        memory_type=f"activity_{activity_type}",
        content=f"On {activity.activity_date}, {activity_type.replace('_', ' ').capitalize()} recorded: {description} "
                f"({amount or ''} {unit or ''}).".strip()
    )
    db.add(memory_entry)
    db.commit()
    db.refresh(activity)
    return activity


def get_farm_memory_context(db: Session, farm_id: str, days: int = 90) -> Dict[str, Any]:
    """Retrieves and synthesizes farm memory timeline for AI context enrichment."""
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        return {"summary": "Farm not found", "activities": [], "disease_history": []}

    cutoff_date = datetime.utcnow() - timedelta(days=days)

    # 1. Activities (Irrigation, Fertilizer, Spraying)
    activities = (
        db.query(FarmActivity)
        .filter(FarmActivity.farm_id == farm_id)
        .order_by(FarmActivity.activity_date.desc())
        .limit(20)
        .all()
    )

    # 2. Disease Scans History
    disease_scans = (
        db.query(DiseaseScan)
        .filter(DiseaseScan.farm_id == farm_id)
        .order_by(DiseaseScan.created_at.desc())
        .limit(10)
        .all()
    )

    # 3. Memory Logs
    memory_logs = (
        db.query(FarmMemoryLog)
        .filter(FarmMemoryLog.farm_id == farm_id)
        .order_by(FarmMemoryLog.created_at.desc())
        .limit(15)
        .all()
    )

    # Format activities list
    activity_list = [
        {
            "id": str(act.id),
            "activity_type": act.activity_type,
            "description": act.description,
            "amount": float(act.amount) if act.amount else None,
            "unit": act.unit,
            "activity_date": act.activity_date.isoformat() if act.activity_date else None
        }
        for act in activities
    ]

    disease_list = [
        {
            "disease_name": ds.disease_name,
            "status": ds.status,
            "date": ds.created_at.strftime("%Y-%m-%d") if ds.created_at else None,
            "recommendation": ds.recommended_action
        }
        for ds in disease_scans
    ]

    # Build prompt-ready memory summary string
    memory_summary_lines = [
        f"Farm Name: {farm.farm_name}",
        f"Current Crop: {farm.crop} (Sown: {farm.sowing_date or 'N/A'}, Area: {farm.area_acres or 'N/A'} acres)"
    ]

    if activities:
        memory_summary_lines.append("\nRecent Farm Activities (Irrigation & Fertilization):")
        for act in activities[:5]:
            amt_str = f" ({act.amount} {act.unit})" if act.amount else ""
            memory_summary_lines.append(f"- {act.activity_date}: {act.activity_type.capitalize()} - {act.description}{amt_str}")

    if disease_scans:
        memory_summary_lines.append("\nPast Disease & Health History:")
        for ds in disease_scans[:3]:
            memory_summary_lines.append(f"- {ds.created_at.strftime('%Y-%m-%d')}: {ds.disease_name or 'Scan'} ({ds.status})")

    memory_summary_str = "\n".join(memory_summary_lines)

    return {
        "farm_id": str(farm_id),
        "farm_name": farm.farm_name,
        "crop": farm.crop,
        "memory_summary": memory_summary_str,
        "activities": activity_list,
        "disease_history": disease_list,
        "total_activities_logged": len(activities)
    }
