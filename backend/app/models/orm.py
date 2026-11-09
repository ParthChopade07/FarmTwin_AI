import uuid
from datetime import datetime

from sqlalchemy import Column, String, Date, Numeric, ForeignKey, DateTime, Integer, Text, Boolean, Float
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geometry

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=True)
    phone = Column(String, unique=True, nullable=True)
    password_hash = Column(String, nullable=True)   # hashed password (bcrypt)
    language = Column(String, nullable=False, default="en")
    role = Column(String, nullable=False, default="farmer")  # 'farmer' | 'buyer'
    district = Column(String, nullable=True)
    state = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Farm(Base):
    __tablename__ = "farms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    farm_name = Column(String, nullable=False)
    crop = Column(String, nullable=False)
    sowing_date = Column(Date, nullable=True)
    area_acres = Column(Numeric(10, 2), nullable=True)
    boundary = Column(Geometry(geometry_type="POLYGON", srid=4326), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class SatelliteObservation(Base):
    __tablename__ = "satellite_observations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    obs_date = Column(Date, nullable=False)
    image_id = Column(String, nullable=True)
    cloud_percentage = Column(Numeric(5, 2), nullable=True)
    ndvi_mean = Column(Numeric(5, 4), nullable=True)
    ndvi_min = Column(Numeric(5, 4), nullable=True)
    ndvi_max = Column(Numeric(5, 4), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Weather(Base):
    __tablename__ = "weather"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    obs_date = Column(Date, nullable=False)
    temperature_c = Column(Numeric(5, 2), nullable=True)
    rainfall_mm = Column(Numeric(6, 2), nullable=True)
    humidity_pct = Column(Numeric(5, 2), nullable=True)


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    pred_date = Column(Date, nullable=False)
    health_score = Column(Integer, nullable=True)
    stress_type = Column(String, nullable=True)
    confidence = Column(Numeric(4, 3), nullable=True)


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    rec_date = Column(Date, nullable=False)
    recommendation = Column(String, nullable=False)
    language = Column(String, nullable=False, default="en")


class MarketplaceListing(Base):
    __tablename__ = "marketplace_listings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    crop = Column(String, nullable=False)
    variety = Column(String, nullable=True)
    quantity = Column(Numeric(10, 2), nullable=False)
    unit = Column(String, nullable=False, default="Quintal")
    expected_price = Column(Numeric(10, 2), nullable=False)
    state = Column(String, nullable=True)
    district = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="active")  # active | sold | closed
    created_at = Column(DateTime, default=datetime.utcnow)


class Offer(Base):
    __tablename__ = "offers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    listing_id = Column(UUID(as_uuid=True), ForeignKey("marketplace_listings.id", ondelete="CASCADE"), nullable=False)
    buyer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    offer_price = Column(Numeric(10, 2), nullable=False)
    quantity = Column(Numeric(10, 2), nullable=True)
    message = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="pending")  # pending | accepted | rejected
    fulfillment_status = Column(String, nullable=True)  # null until accepted, then: awaiting_payment | paid | delivered
    created_at = Column(DateTime, default=datetime.utcnow)


class ServiceBooking(Base):
    __tablename__ = "service_bookings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id", ondelete="SET NULL"), nullable=True)
    service_type = Column(String, nullable=False)  # spray | crop_cutting | soil_test | etc.
    scheduled_date = Column(Date, nullable=False)
    area_acres = Column(Numeric(10, 2), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="pending")  # pending | confirmed | completed | cancelled
    created_at = Column(DateTime, default=datetime.utcnow)

    # --- Phase 3: Escrow / Payment ---
    escrow_amount = Column(Numeric(10, 2), nullable=True)
    escrow_status = Column(String, default="held_in_escrow")  # held_in_escrow | released | refunded
    payment_method = Column(String, default="upi_autopay")

    # --- Phase 2: Operator Dispatch ---
    operator_id = Column(UUID(as_uuid=True), nullable=True)
    operator_name = Column(String, nullable=True)
    operator_phone = Column(String, nullable=True)
    operator_vehicle = Column(String, nullable=True)
    operator_distance_km = Column(Numeric(5, 2), nullable=True)
    dispatch_whatsapp_url = Column(Text, nullable=True)

    # --- Phase 4: Proof of Work ---
    proof_of_work_status = Column(String, default="unverified")  # unverified | verified | disputed
    proof_coverage_pct = Column(Numeric(5, 2), default=0.0)
    proof_log_name = Column(String, nullable=True)
    proof_verified_at = Column(DateTime, nullable=True)
    payout_released_at = Column(DateTime, nullable=True)


class Operator(Base):
    """Verified equipment operator / CHC partner registry."""
    __tablename__ = "operators"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    equipment_type = Column(String, nullable=False)
    category = Column(String, nullable=False)  # drone | machinery | soil | storage
    base_location = Column(String, nullable=False)
    lat = Column(Numeric(10, 6), default=18.5204)
    lng = Column(Numeric(10, 6), default=73.8567)
    operating_radius_km = Column(Integer, default=25)
    rating = Column(Numeric(3, 2), default=4.9)
    completed_jobs = Column(Integer, default=0)
    dgca_license = Column(String, nullable=True)
    is_verified = Column(Boolean, default=True)
    status = Column(String, default="standby")  # standby | busy | offline
    created_at = Column(DateTime, default=datetime.utcnow)


class DiseaseScan(Base):
    __tablename__ = "disease_scans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id", ondelete="SET NULL"), nullable=True)
    crop = Column(String, nullable=True)
    status = Column(String, nullable=True)  # Healthy | At Risk | Diseased
    disease_name = Column(String, nullable=True)
    confidence_label = Column(String, nullable=True)  # Low | Medium | High
    summary = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    lat = Column(Numeric(10, 6), nullable=True)
    lon = Column(Numeric(10, 6), nullable=True)
    image_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class FarmActivity(Base):
    __tablename__ = "farm_activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    activity_type = Column(String, nullable=False)  # irrigation | fertilizer | pesticide | harvesting | soil_treatment
    description = Column(Text, nullable=False)
    amount = Column(Numeric(10, 2), nullable=True)
    unit = Column(String, nullable=True)  # Liters | Kg | Hours | Quintals
    activity_date = Column(Date, nullable=False, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)


class FarmMemoryLog(Base):
    __tablename__ = "farm_memory_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    memory_type = Column(String, nullable=False)  # crop_history | disease_record | yield_record | farmer_preference
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class FarmWeeklyReport(Base):
    __tablename__ = "farm_weekly_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    report_week = Column(String, nullable=False)  # e.g., "2026-W37"
    summary_text = Column(Text, nullable=False)
    weather_outlook = Column(Text, nullable=True)
    risks_identified = Column(Text, nullable=True)
    recommended_actions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)



class EnamGatePass(Base):
    __tablename__ = "enam_gate_passes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    gate_pass_id = Column(String, unique=True, nullable=False, index=True)
    enam_lot_id = Column(String, nullable=False, index=True)
    listing_id = Column(UUID(as_uuid=True), ForeignKey("marketplace_listings.id", ondelete="CASCADE"), nullable=False)
    farmer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    mandi_code = Column(String, nullable=False, default="APMC_MH_PUN_01")
    mandi_name = Column(String, nullable=False, default="Pune APMC Market Yard (Gultekdi)")
    state = Column(String, nullable=False, default="Maharashtra")
    seller_name = Column(String, nullable=False)
    seller_phone = Column(String, nullable=True)
    commodity = Column(String, nullable=False)
    variety = Column(String, nullable=True)
    quantity_quintals = Column(Numeric(10, 2), nullable=False)
    expected_price_per_qtl = Column(Numeric(10, 2), nullable=False)
    total_valuation_inr = Column(Numeric(12, 2), nullable=False)
    mandi_cess_0_5_pct = Column(Numeric(10, 2), nullable=False)
    user_charge_1_pct = Column(Numeric(10, 2), nullable=False)
    total_mandi_fee = Column(Numeric(10, 2), nullable=False)
    moisture_pct = Column(Float, nullable=True, default=11.4)
    foreign_matter_pct = Column(Float, nullable=True, default=0.8)
    damaged_grains_pct = Column(Float, nullable=True, default=0.5)
    quality_grade = Column(String, nullable=False, default="Grade A (Fair Average Quality - FAQ)")
    assay_lab = Column(String, nullable=False, default="Government Certified e-NAM Assaying Lab")
    weighbridge_barcode = Column(String, nullable=False)
    status = Column(String, nullable=False, default="ISSUED_VALID")  # ISSUED_VALID | GATE_IN_VERIFIED | WEIGHED_IN | AUCTION_READY
    vehicle_number = Column(String, nullable=True)
    gross_weight_quintals = Column(Numeric(10, 2), nullable=True)
    tare_weight_quintals = Column(Numeric(10, 2), nullable=True)
    net_weight_quintals = Column(Numeric(10, 2), nullable=True)
    qr_payload = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    gate_in_at = Column(DateTime, nullable=True)
    weighed_at = Column(DateTime, nullable=True)


class CarbonCreditRetirement(Base):
    __tablename__ = "carbon_credit_retirements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    certificate_id = Column(String, unique=True, nullable=False, index=True)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    registry = Column(String, nullable=False, default="Verra Verified Carbon Standard (VCS) & India BEE CCTS")
    methodology = Column(String, nullable=False, default="VM0042 - Improved Agricultural Land Management")
    project_id = Column(String, nullable=False, index=True)
    serial_numbers = Column(String, nullable=False)
    credits_retired = Column(Integer, nullable=False)
    co2e_metric_tonnes = Column(Numeric(10, 2), nullable=False)
    soc_baseline_pct = Column(Float, nullable=True)
    buyer_corporate = Column(String, nullable=False)
    escrow_payout_inr = Column(Numeric(12, 2), nullable=False)
    payout_channel = Column(String, nullable=False, default="Direct UPI Bank Escrow")
    verification_auditor = Column(String, nullable=False, default="Bureau Veritas India / TUV SUD Carbon Audit")
    cryptographic_hash = Column(String, nullable=False)
    status = Column(String, nullable=False, default="RETIRED_SETTLED")
    retired_at = Column(DateTime, default=datetime.utcnow)
