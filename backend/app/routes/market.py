"""AI Selling Advisor.

  GET /api/market/advisor?crop=Wheat&quantity=145&farm_id=<uuid optional>

If farm_id is given and resolvable, the estimate is nudged by that farm's
real recent rainfall/temperature (see services/market.py for the disclosed
methodology). Otherwise it falls back to the crop-only estimate.
"""
from fastapi import APIRouter, Depends
from geoalchemy2.shape import to_shape
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.orm import Farm
from app.services import market as market_service
from app.services import weather as weather_service
from app.services.geo import polygon_centroid

router = APIRouter(prefix="/api/market", tags=["market"])


@router.get("/advisor")
def selling_advisor(
    crop: str,
    quantity: float | None = None,
    farm_id: str | None = None,
    storage_cost_per_day: float = 2.0,
    db: Session = Depends(get_db),
):
    rainfall_7d = None
    temp_avg_7d = None

    lat, lon = None, None
    farm = None
    if farm_id:
        farm = db.query(Farm).filter(Farm.id == farm_id).first()
        if farm:
            try:
                boundary = to_shape(farm.boundary).__geo_interface__
                centroid = polygon_centroid(boundary)
                lat = centroid["lat"]
                lon = centroid["lon"]
                weather_summary = weather_service.get_farm_weather(lat, lon)
                rainfall_7d = weather_summary.get("rainfall_7d_mm")
                temp_avg_7d = weather_summary.get("temperature_avg_7d_c")
            except weather_service.WeatherServiceError:
                pass

    # Retrieve user district from farm owner if available or reverse geocode from centroid
    district = None
    if farm_id and farm:
        from app.models.orm import User
        user = db.query(User).filter(User.id == farm.user_id).first()
        if user and user.district:
            district = user.district
        elif lat and lon:
            from app.services.geo import get_location_for_coords
            loc = get_location_for_coords(lat, lon)
            district = loc.get("district")

    return market_service.estimate_prices(
        crop=crop,
        quantity_qtl=quantity,
        rainfall_7d_mm=rainfall_7d,
        temperature_avg_7d_c=temp_avg_7d,
        district=district,
        lat=lat,
        lon=lon,
        storage_cost_per_day=storage_cost_per_day,
    )


from pydantic import BaseModel, Field
from app.services import roi_simulator as roi_service

class RoiSimulationRequest(BaseModel):
    crop: str = "Wheat"
    seed_type: str = "hyv"
    budget: float = 50000.0
    acreage: float = 2.0
    farm_id: str | None = None
    language: str = "en"


@router.post("/roi-simulator")
def simulate_roi_post(req: RoiSimulationRequest):
    return roi_service.simulate_crop_roi(
        crop=req.crop,
        seed_type=req.seed_type,
        budget=req.budget,
        acreage=req.acreage,
        farm_id=req.farm_id,
        language=req.language,
    )


@router.get("/roi-simulator")
def simulate_roi_get(
    crop: str = "Wheat",
    seed_type: str = "hyv",
    budget: float = 50000.0,
    acreage: float = 2.0,
    farm_id: str | None = None,
    language: str = "en",
):
    return roi_service.simulate_crop_roi(
        crop=crop,
        seed_type=seed_type,
        budget=budget,
        acreage=acreage,
        farm_id=farm_id,
        language=language,
    )

