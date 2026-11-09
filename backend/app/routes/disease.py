"""AI Crop Disease Detection.

  POST /api/disease/detect (multipart form: file, crop?, user_id?, farm_id?, language?)
  GET  /api/disease/history?user_id=
"""
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.orm import DiseaseScan
from app.services import disease as disease_service
from app.services import disease_radar as radar_service
from app.services import disease_sentinel as sentinel_service
from app.services.assistant import AssistantConfigError

router = APIRouter(prefix="/api/disease", tags=["disease"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.get("/sentinel")
def community_disease_sentinel(
    radius_km: int = 25,
    crop: str = "All",
    district: str = "Satara",
    farm_id: str | None = None,
    lat: float | None = None,
    lon: float | None = None,
    db: Session = Depends(get_db),
    language: str = "en",
):
    """GET /api/disease/sentinel - 25km Local Community Outbreak Radar (Peer Disease Sentinel)."""
    return sentinel_service.get_community_disease_sentinel(
        radius_km=radius_km, crop=crop, district=district, farm_id=farm_id, lat=lat, lon=lon, language=language, db=db
    )


@router.get("/radar")
def disease_radar(
    crop: str | None = None,
    language: str = "en",
    farm_id: str | None = None,
    db: Session = Depends(get_db),
):
    """GET /api/disease/radar - Hyperlocal 48-Hour Early Warning Outbreak Radar."""
    farm_context = None
    if farm_id:
        from app.models.orm import Farm, SatelliteObservation
        farm = db.query(Farm).filter(Farm.id == farm_id).first()
        if farm:
            from geoalchemy2.shape import to_shape
            from app.services.geo import polygon_centroid
            from app.services import weather as weather_service
            weather_data = None
            try:
                boundary = to_shape(farm.boundary).__geo_interface__
                centroid = polygon_centroid(boundary)
                weather_data = weather_service.get_farm_weather(centroid["lat"], centroid["lon"])
            except Exception:
                pass
            latest_obs = db.query(SatelliteObservation).filter(SatelliteObservation.farm_id == farm.id).order_by(SatelliteObservation.obs_date.desc()).first()
            farm_context = {
                "farm_name": farm.farm_name,
                "crop": farm.crop or crop,
                "ndvi": {"ndvi_mean": float(latest_obs.ndvi_mean)} if latest_obs and latest_obs.ndvi_mean else None,
                "weather": {
                    "temperature_c": weather_data.get("current", {}).get("temperature_c") if weather_data else None,
                    "humidity_pct": weather_data.get("current", {}).get("humidity_pct") if weather_data else None,
                    "rainfall_7d_mm": weather_data.get("rainfall_7d_mm") if weather_data else None,
                } if weather_data else None,
            }
            target_crop = crop or farm.crop or "Sugarcane"
    else:
        target_crop = crop or "Sugarcane"

    return radar_service.analyze_disease_outbreak_radar(crop=target_crop, language=language, farm_context=farm_context)






@router.post("/detect")
async def detect_disease(
    file: UploadFile = File(...),
    crop: str | None = Form(None),
    user_id: str | None = Form(None),
    farm_id: str | None = Form(None),
    language: str = Form("en"),
    lat: float | None = Form(None),
    lon: float | None = Form(None),
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Upload a JPEG, PNG, or WEBP image.")

    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB limit
    image_bytes = await file.read(MAX_FILE_SIZE + 1)
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty file.")
    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum image size is 10MB.")

    try:
        result = disease_service.analyze_image(image_bytes, file.content_type, crop=crop, language=language)
    except AssistantConfigError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # If lat/lon not provided but farm_id is, calculate from farm boundary centroid
    if farm_id and (lat is None or lon is None):
        try:
            from app.models.orm import Farm
            farm_obj = db.query(Farm).filter(Farm.id == farm_id).first()
            if farm_obj and farm_obj.boundary:
                coords = farm_obj.boundary.get("coordinates", [[]])[0]
                if coords:
                    lat = round(sum(p[1] for p in coords) / len(coords), 6)
                    lon = round(sum(p[0] for p in coords) / len(coords), 6)
        except Exception:
            pass

    import base64
    # Store compact data URI for instant map popup thumbnail
    image_thumb = None
    if len(image_bytes) < 3 * 1024 * 1024:
        image_thumb = f"data:{file.content_type};base64,{base64.b64encode(image_bytes).decode('ascii')}"

    scan = DiseaseScan(
        user_id=user_id,
        farm_id=farm_id,
        crop=crop,
        status=result.get("status"),
        disease_name=result.get("disease_name"),
        confidence_label=result.get("confidence_label"),
        summary=result.get("summary"),
        recommended_action=result.get("recommended_action"),
        lat=lat,
        lon=lon,
        image_url=image_thumb,
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    return {**result, "scan_id": str(scan.id), "created_at": scan.created_at}


@router.get("/history")
def scan_history(user_id: str, db: Session = Depends(get_db)):
    scans = (
        db.query(DiseaseScan)
        .filter(DiseaseScan.user_id == user_id)
        .order_by(DiseaseScan.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "scan_id": str(s.id),
            "crop": s.crop,
            "status": s.status,
            "disease_name": s.disease_name,
            "confidence_label": s.confidence_label,
            "summary": s.summary,
            "recommended_action": s.recommended_action,
            "created_at": s.created_at,
        }
        for s in scans
    ]
