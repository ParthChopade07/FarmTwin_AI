"""Explainable AI (XAI) API Routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.orm import Farm, SatelliteObservation, Weather
from app.services.xai import analyze_farm_explainable_ai

router = APIRouter(prefix="/api/farms", tags=["Explainable AI"])


@router.get("/{farm_id}/xai")
def get_farm_xai(farm_id: str, db: Session = Depends(get_db)):
    """Returns Explainable AI factor attributions and driver breakdown for a farm."""
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    # Fetch latest satellite observation
    sat_obs = (
        db.query(SatelliteObservation)
        .filter(SatelliteObservation.farm_id == farm_id)
        .order_by(SatelliteObservation.obs_date.desc())
        .first()
    )
    ndvi_mean = float(sat_obs.ndvi_mean) if sat_obs and sat_obs.ndvi_mean else 0.65
    ndvi_change_pct = -2.5

    # Fetch latest weather reading
    weather_obs = (
        db.query(Weather)
        .filter(Weather.farm_id == farm_id)
        .order_by(Weather.obs_date.desc())
        .first()
    )
    temp = float(weather_obs.temperature_c) if weather_obs and weather_obs.temperature_c else 28.5
    rain_7d = float(weather_obs.rainfall_mm) if weather_obs and weather_obs.rainfall_mm else 35.0
    rain_30d = rain_7d * 3.0
    humidity = float(weather_obs.humidity_pct) if weather_obs and weather_obs.humidity_pct else 68.0

    return analyze_farm_explainable_ai(
        farm_name=farm.farm_name,
        crop=farm.crop,
        ndvi_mean=ndvi_mean,
        ndvi_change_pct=ndvi_change_pct,
        rainfall_7d_mm=rain_7d,
        rainfall_30d_mm=rain_30d,
        temperature_avg_7d_c=temp,
        humidity_avg_7d_pct=humidity
    )
