"""Weekly Farm Intelligence Report API Routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.orm import Farm, FarmWeeklyReport, SatelliteObservation, Weather
from app.services.weekly_report import generate_weekly_farm_report

router = APIRouter(prefix="/api/farms", tags=["Weekly Report"])


@router.get("/{farm_id}/weekly-report")
def get_weekly_report(farm_id: str, db: Session = Depends(get_db)):
    """Fetches the latest stored weekly report or generates one on the fly."""
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    existing = (
        db.query(FarmWeeklyReport)
        .filter(FarmWeeklyReport.farm_id == farm_id)
        .order_by(FarmWeeklyReport.created_at.desc())
        .first()
    )

    if existing:
        return {
            "report_id": str(existing.id),
            "farm_id": str(farm_id),
            "farm_name": farm.farm_name,
            "crop": farm.crop,
            "report_week": existing.report_week,
            "summary_text": existing.summary_text,
            "weather_outlook": existing.weather_outlook,
            "risks_identified": existing.risks_identified,
            "recommended_actions": existing.recommended_actions,
            "created_at": existing.created_at.isoformat()
        }

    # Generate new report
    sat_obs = (
        db.query(SatelliteObservation)
        .filter(SatelliteObservation.farm_id == farm_id)
        .order_by(SatelliteObservation.obs_date.desc())
        .first()
    )
    ndvi_mean = float(sat_obs.ndvi_mean) if sat_obs and sat_obs.ndvi_mean else 0.65

    weather_obs = (
        db.query(Weather)
        .filter(Weather.farm_id == farm_id)
        .order_by(Weather.obs_date.desc())
        .first()
    )
    temp = float(weather_obs.temperature_c) if weather_obs and weather_obs.temperature_c else 28.5
    rain_7d = float(weather_obs.rainfall_mm) if weather_obs and weather_obs.rainfall_mm else 35.0

    return generate_weekly_farm_report(
        db,
        farm_id=farm_id,
        ndvi_mean=ndvi_mean,
        rainfall_7d_mm=rain_7d,
        temperature_avg_7d_c=temp
    )


@router.post("/{farm_id}/weekly-report/generate")
def trigger_generate_weekly_report(farm_id: str, db: Session = Depends(get_db)):
    """Triggers generation of a fresh Weekly Farm Report."""
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    sat_obs = (
        db.query(SatelliteObservation)
        .filter(SatelliteObservation.farm_id == farm_id)
        .order_by(SatelliteObservation.obs_date.desc())
        .first()
    )
    ndvi_mean = float(sat_obs.ndvi_mean) if sat_obs and sat_obs.ndvi_mean else 0.65

    weather_obs = (
        db.query(Weather)
        .filter(Weather.farm_id == farm_id)
        .order_by(Weather.obs_date.desc())
        .first()
    )
    temp = float(weather_obs.temperature_c) if weather_obs and weather_obs.temperature_c else 28.5
    rain_7d = float(weather_obs.rainfall_mm) if weather_obs and weather_obs.rainfall_mm else 35.0

    return generate_weekly_farm_report(
        db,
        farm_id=farm_id,
        ndvi_mean=ndvi_mean,
        rainfall_7d_mm=rain_7d,
        temperature_avg_7d_c=temp
    )
