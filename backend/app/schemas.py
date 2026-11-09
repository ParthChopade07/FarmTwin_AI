import uuid
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class GeoJSONPolygon(BaseModel):
    type: str = Field(default="Polygon")
    coordinates: List[List[List[float]]]


class FarmCreate(BaseModel):
    user_id: uuid.UUID
    farm_name: str
    crop: str
    sowing_date: Optional[date] = None
    boundary: GeoJSONPolygon


class FarmOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    farm_name: str
    crop: str
    sowing_date: Optional[date] = None
    area_acres: Optional[float] = None
    boundary: GeoJSONPolygon
    created_at: datetime
    location: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    centroid: Optional[dict] = None

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None   # plain-text; hashed before storing
    language: str = "en"
    role: str = "farmer"
    district: Optional[str] = None
    state: Optional[str] = None


class UserLogin(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None


class UserOut(BaseModel):
    id: uuid.UUID
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    language: str
    role: str
    district: Optional[str] = None
    state: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Marketplace ----


class ListingCreate(BaseModel):
    user_id: uuid.UUID
    crop: str
    variety: Optional[str] = None
    quantity: float
    unit: str = "Quintal"
    expected_price: float
    state: Optional[str] = None
    district: Optional[str] = None
    description: Optional[str] = None


class ListingOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    crop: str
    variety: Optional[str] = None
    quantity: float
    unit: str
    expected_price: float
    state: Optional[str] = None
    district: Optional[str] = None
    description: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class OfferCreate(BaseModel):
    buyer_id: uuid.UUID
    offer_price: float
    quantity: Optional[float] = None
    message: Optional[str] = None


class OfferOut(BaseModel):
    id: uuid.UUID
    listing_id: uuid.UUID
    buyer_id: uuid.UUID
    offer_price: float
    quantity: Optional[float] = None
    message: Optional[str] = None
    status: str
    fulfillment_status: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OfferStatusUpdate(BaseModel):
    status: str  # accepted | rejected


class FulfillmentUpdate(BaseModel):
    fulfillment_status: str  # awaiting_payment | paid | delivered


# ---- Service hub ----


class ServiceBookingCreate(BaseModel):
    user_id: uuid.UUID
    farm_id: Optional[uuid.UUID] = None
    service_type: str
    scheduled_date: date
    area_acres: Optional[float] = None
    notes: Optional[str] = None


class ServiceBookingOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    farm_id: Optional[uuid.UUID] = None
    service_type: str
    scheduled_date: date
    area_acres: Optional[float] = None
    notes: Optional[str] = None
    status: str
    created_at: datetime
    # Escrow / dispatch fields (optional — present after dispatch)
    escrow_amount: Optional[float] = None
    escrow_status: Optional[str] = None
    operator_name: Optional[str] = None
    operator_phone: Optional[str] = None
    operator_vehicle: Optional[str] = None
    operator_distance_km: Optional[float] = None
    dispatch_whatsapp_url: Optional[str] = None
    proof_of_work_status: Optional[str] = None
    proof_coverage_pct: Optional[float] = None
    proof_log_name: Optional[str] = None
    payout_released_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- Assistant (medicine) ----


class MedicineAskRequest(BaseModel):
    question: str
    crop: Optional[str] = None
    language: Optional[str] = "en"


# ---- Explainable AI & Weekly Report & Farm Memory ----


class FarmActivityCreate(BaseModel):
    activity_type: str
    description: str
    amount: Optional[float] = None
    unit: Optional[str] = None
    activity_date: Optional[date] = None


class RiskFactorOut(BaseModel):
    factor_name: str
    category: str
    impact_weight: float
    status: str
    explanation: str


class XAIOut(BaseModel):
    farm_name: str
    crop: str
    overall_risk_score: float
    overall_status: str
    primary_cause: str
    contributing_factors: List[RiskFactorOut]
    xai_summary: str


class WeeklyReportOut(BaseModel):
    report_id: str
    farm_id: str
    farm_name: str
    crop: str
    report_week: str
    summary_text: str
    weather_outlook: Optional[str] = None
    risks_identified: Optional[str] = None
    recommended_actions: Optional[str] = None
    created_at: str

