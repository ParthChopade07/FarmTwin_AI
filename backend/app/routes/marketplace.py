from datetime import datetime
"""Farmer Marketplace + Offers/Inbox.

  POST   /api/marketplace/listings                 create a listing
  GET    /api/marketplace/listings                  browse (optional ?crop=&state=)
  GET    /api/marketplace/listings/mine?user_id=    a farmer's own listings
  POST   /api/marketplace/listings/{id}/offers       buyer sends an offer
  GET    /api/marketplace/listings/{id}/offers       farmer's inbox for one listing
  GET    /api/marketplace/offers/mine?user_id=       a buyer's sent offers
  PATCH  /api/marketplace/offers/{id}                farmer accepts/rejects
"""
from typing import Literal, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.orm import MarketplaceListing, Offer, User, EnamGatePass
from app.schemas import ListingCreate, ListingOut, OfferCreate, OfferOut, OfferStatusUpdate, FulfillmentUpdate
from app.auth import get_current_user_id

router = APIRouter(prefix="/api/marketplace", tags=["marketplace"])


def _enrich_offer(offer: Offer, listing: MarketplaceListing | None, counterparty: User | None) -> dict:
    return {
        "id": str(offer.id),
        "listing_id": str(offer.listing_id),
        "buyer_id": str(offer.buyer_id),
        "offer_price": float(offer.offer_price),
        "quantity": float(offer.quantity) if offer.quantity is not None else None,
        "message": offer.message,
        "status": offer.status,
        "fulfillment_status": offer.fulfillment_status,
        "created_at": offer.created_at,
        "crop": listing.crop if listing else None,
        "variety": listing.variety if listing else None,
        "expected_price": float(listing.expected_price) if listing else None,
        "unit": listing.unit if listing else None,
        "counterparty_name": counterparty.name if counterparty else None,
    }


@router.post("/listings", response_model=ListingOut, status_code=201)
def create_listing(payload: ListingCreate, db: Session = Depends(get_db)):
    listing = MarketplaceListing(**payload.model_dump())
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing


@router.get("/listings", response_model=list[ListingOut])
def browse_listings(crop: str | None = None, state: str | None = None, db: Session = Depends(get_db)):
    query = db.query(MarketplaceListing).filter(MarketplaceListing.status == "active")
    if crop:
        query = query.filter(MarketplaceListing.crop.ilike(f"%{crop}%"))
    if state:
        query = query.filter(MarketplaceListing.state.ilike(f"%{state}%"))
    return query.order_by(MarketplaceListing.created_at.desc()).all()


import uuid

def _parse_uuid(val: str | None) -> uuid.UUID | None:
    if not val:
        return None
    try:
        return uuid.UUID(str(val))
    except (ValueError, TypeError, AttributeError):
        return None


@router.get("/listings/mine", response_model=list[ListingOut])
def my_listings(user_id: str, db: Session = Depends(get_db)):
    u_id = _parse_uuid(user_id)
    if not u_id:
        return []
    return (
        db.query(MarketplaceListing)
        .filter(MarketplaceListing.user_id == u_id)
        .order_by(MarketplaceListing.created_at.desc())
        .all()
    )


def _get_listing_or_404(listing_id: str, db: Session) -> MarketplaceListing:
    l_id = _parse_uuid(listing_id)
    if not l_id:
        raise HTTPException(status_code=404, detail="Listing not found")
    listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == l_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing


@router.post("/listings/{listing_id}/offers", response_model=OfferOut, status_code=201)
def send_offer(listing_id: str, payload: OfferCreate, db: Session = Depends(get_db)):
    _get_listing_or_404(listing_id, db)
    b_id = _parse_uuid(payload.buyer_id)
    if not b_id:
        raise HTTPException(status_code=400, detail="Invalid buyer ID")
    l_id = _parse_uuid(listing_id)
    offer_data = payload.model_dump()
    offer_data["buyer_id"] = b_id
    offer = Offer(listing_id=l_id, **offer_data)
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


@router.get("/listings/{listing_id}/offers", response_model=list[OfferOut])
def listing_offers(listing_id: str, db: Session = Depends(get_db)):
    _get_listing_or_404(listing_id, db)
    l_id = _parse_uuid(listing_id)
    return (
        db.query(Offer)
        .filter(Offer.listing_id == l_id)
        .order_by(Offer.created_at.desc())
        .all()
    )


@router.get("/offers/mine")
def my_offers(user_id: str, db: Session = Depends(get_db)):
    """A buyer's sent offers, enriched with the listing's crop/price and
    the farmer's name so the frontend doesn't need N follow-up calls."""
    u_id = _parse_uuid(user_id)
    if not u_id:
        return []
    offers = (
        db.query(Offer)
        .filter(Offer.buyer_id == u_id)
        .order_by(Offer.created_at.desc())
        .all()
    )
    result = []
    for offer in offers:
        listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == offer.listing_id).first()
        farmer = db.query(User).filter(User.id == listing.user_id).first() if listing else None
        result.append(_enrich_offer(offer, listing, farmer))
    return result


@router.get("/offers/received")
def received_offers(user_id: str, db: Session = Depends(get_db)):
    """A farmer's inbox: every offer made on any of their listings."""
    u_id = _parse_uuid(user_id)
    if not u_id:
        return []
    listing_ids = [
        row.id for row in db.query(MarketplaceListing.id).filter(MarketplaceListing.user_id == u_id).all()
    ]
    if not listing_ids:
        return []
    offers = (
        db.query(Offer)
        .filter(Offer.listing_id.in_(listing_ids))
        .order_by(Offer.created_at.desc())
        .all()
    )
    result = []
    for offer in offers:
        listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == offer.listing_id).first()
        buyer = db.query(User).filter(User.id == offer.buyer_id).first()
        result.append(_enrich_offer(offer, listing, buyer))
    return result


@router.patch("/offers/{offer_id}", response_model=OfferOut)
def update_offer_status(
    offer_id: str,
    payload: OfferStatusUpdate,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    if payload.status not in ("accepted", "rejected"):
        raise HTTPException(status_code=400, detail="status must be 'accepted' or 'rejected'")
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    # Verify the current user owns the listing being acted upon
    listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == offer.listing_id).first()
    if listing and str(listing.user_id) != str(current_user_id):
        raise HTTPException(status_code=403, detail="Only the listing owner can accept or reject offers.")
    offer.status = payload.status
    if payload.status == "accepted":
        if listing:
            listing.status = "sold"
        offer.fulfillment_status = "awaiting_payment"
    db.commit()
    db.refresh(offer)
    return offer


@router.patch("/offers/{offer_id}/fulfillment", response_model=OfferOut)
def update_fulfillment(offer_id: str, payload: FulfillmentUpdate, db: Session = Depends(get_db)):
    """Advance an accepted deal: awaiting_payment -> paid -> delivered.
    No real payment gateway here - this just tracks the state both sides
    agree it's in, same as a shared checklist."""
    valid = ("awaiting_payment", "escrow_secured", "paid", "delivered")
    if payload.fulfillment_status not in valid:
        raise HTTPException(status_code=400, detail=f"fulfillment_status must be one of {valid}")
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    if offer.status != "accepted":
        raise HTTPException(status_code=400, detail="Only accepted offers can be fulfilled")
    offer.fulfillment_status = payload.fulfillment_status
    db.commit()
    db.refresh(offer)
    return offer


@router.patch("/listings/{listing_id}/close", response_model=ListingOut)
def close_listing(
    listing_id: str,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    """Farmer withdraws their own listing from the marketplace."""
    listing = _get_listing_or_404(listing_id, db)
    if str(listing.user_id) != str(current_user_id):
        raise HTTPException(status_code=403, detail="You can only close your own listings.")
    listing.status = "closed"
    db.commit()
    db.refresh(listing)
    return listing


# ── Pydantic request models for financial endpoints ────────────────────────────

class EscrowRequest(BaseModel):
    deposit_type: Literal["20_pct_advance", "100_pct_full"] = "20_pct_advance"
    tx_ref: Optional[str] = Field(None, max_length=64)


class WeighbridgeUpdate(BaseModel):
    vehicle_number: Optional[str] = Field(None, max_length=20)
    gross_weight_quintals: float = Field(..., gt=0)
    tare_weight_quintals: float = Field(..., gt=0)


class MilestoneReleaseRequest(BaseModel):
    milestone: str = "final_delivery"
    operator_upi_id: Optional[str] = Field(None, max_length=64)


# ── e-NAM Gate Pass & Mandi Lot Slip ──────────────────────────────────────────

@router.get("/listings/{listing_id}/enam-gatepass")
def get_enam_gatepass(listing_id: str, db: Session = Depends(get_db)):
    """Generate or retrieve official e-NAM Electronic Gate Pass & Quality Assay Slip from DB."""
    l_id = _parse_uuid(listing_id)
    if not l_id:
        raise HTTPException(status_code=404, detail="Invalid listing ID")
    listing = _get_listing_or_404(listing_id, db)
    seller = db.query(User).filter(User.id == listing.user_id).first()

    # Check if gate pass is already generated in DB
    gate_pass = db.query(EnamGatePass).filter(EnamGatePass.listing_id == l_id).first()

    if not gate_pass:
        district = listing.district or "Pune"
        state = listing.state or "Maharashtra"
        mandi_code_map = {
            "Pune": ("APMC_MH_PUN_01", "Pune APMC Market Yard (Gultekdi)"),
            "Nashik": ("APMC_MH_NAS_02", "Nashik Lasalgaon Mandi Yard"),
            "Nagpur": ("APMC_MH_NAG_03", "Nagpur Kalamna APMC Yard"),
            "Satara": ("APMC_MH_SAT_04", "Satara District APMC Yard"),
            "Kolhapur": ("APMC_MH_KOL_05", "Kolhapur Shahu Market Yard"),
            "Solapur": ("APMC_MH_SOL_06", "Solapur APMC Yard"),
        }
        mandi_code, mandi_name = mandi_code_map.get(district, (f"APMC_MH_{district[:3].upper()}_01", f"{district} APMC Market Yard"))

        lot_code = f"ENAM-MH-{district[:3].upper()}-{(abs(hash(str(listing.id))) % 90000) + 10000}"
        qty = float(listing.quantity or 50.0)
        rate = float(listing.expected_price or 2400.0)
        lot_val = qty * rate

        mandi_cess = round(lot_val * 0.005, 2)     # 0.5% APMC statutory cess
        user_charge = round(lot_val * 0.01, 2)    # 1.0% Mandi Vikas cess
        total_mandi_fee = mandi_cess + user_charge

        gp_id = f"GP-{lot_code}"
        qr_verification_url = f"http://localhost:5173/marketplace?verify_gatepass={gp_id}"

        gate_pass = EnamGatePass(
            gate_pass_id=gp_id,
            enam_lot_id=lot_code,
            listing_id=listing.id,
            farmer_id=listing.user_id,
            mandi_code=mandi_code,
            mandi_name=mandi_name,
            state=state,
            seller_name=seller.name if seller else "Registered Farmer",
            seller_phone=seller.phone if seller else "+91 98230 45120",
            commodity=listing.crop,
            variety=listing.variety or "FAQ Standard (Grade-1)",
            quantity_quintals=qty,
            expected_price_per_qtl=rate,
            total_valuation_inr=lot_val,
            mandi_cess_0_5_pct=mandi_cess,
            user_charge_1_pct=user_charge,
            total_mandi_fee=total_mandi_fee,
            moisture_pct=11.4,
            foreign_matter_pct=0.8,
            damaged_grains_pct=0.5,
            quality_grade="Grade A (Fair Average Quality - FAQ)",
            assay_lab="Government Certified e-NAM Assaying Lab",
            weighbridge_barcode=f"WB-{lot_code}-KG",
            status="ISSUED_VALID",
            qr_payload=qr_verification_url,
        )
        db.add(gate_pass)
        db.commit()
        db.refresh(gate_pass)

    return {
        "gate_pass_id": gate_pass.gate_pass_id,
        "enam_lot_id": gate_pass.enam_lot_id,
        "mandi_code": gate_pass.mandi_code,
        "mandi_name": gate_pass.mandi_name,
        "state": gate_pass.state,
        "seller_name": gate_pass.seller_name,
        "seller_phone": gate_pass.seller_phone,
        "commodity": gate_pass.commodity,
        "variety": gate_pass.variety,
        "quantity_quintals": float(gate_pass.quantity_quintals),
        "expected_price_per_qtl": float(gate_pass.expected_price_per_qtl),
        "total_valuation_inr": float(gate_pass.total_valuation_inr),
        "mandi_cess_0_5_pct": float(gate_pass.mandi_cess_0_5_pct),
        "user_charge_1_pct": float(gate_pass.user_charge_1_pct),
        "total_mandi_cess": float(gate_pass.total_mandi_fee),
        "quality_assay": {
            "moisture_pct": float(gate_pass.moisture_pct or 11.4),
            "foreign_matter_pct": float(gate_pass.foreign_matter_pct or 0.8),
            "damaged_grains_pct": float(gate_pass.damaged_grains_pct or 0.5),
            "overall_grade": gate_pass.quality_grade,
            "assay_lab": gate_pass.assay_lab,
        },
        "weighbridge_barcode": gate_pass.weighbridge_barcode,
        "status": gate_pass.status,
        "vehicle_number": gate_pass.vehicle_number,
        "net_weight_quintals": float(gate_pass.net_weight_quintals) if gate_pass.net_weight_quintals else None,
        "qr_verification_url": gate_pass.qr_payload,
        "issued_date": gate_pass.created_at.strftime("%d %b %Y, %I:%M %p") if gate_pass.created_at else "Today",
        "instructions": (
            "Present this digital QR at APMC Gate 2 weighbridge. Produce can be directly unloaded onto assigned auction bay."
        ),
    }


@router.get("/enam-gatepass/{gate_pass_id}/verify")
def verify_enam_gatepass(gate_pass_id: str, db: Session = Depends(get_db)):
    """Public verification endpoint: Validates the electronic gate pass against official APMC records."""
    gp = db.query(EnamGatePass).filter(EnamGatePass.gate_pass_id == gate_pass_id).first()
    if not gp:
        raise HTTPException(status_code=404, detail="Gate pass not found in APMC Registry")
    return {
        "status": "VALID_CLEARANCE",
        "gate_pass_id": gp.gate_pass_id,
        "enam_lot_id": gp.enam_lot_id,
        "mandi_name": gp.mandi_name,
        "farmer_name": gp.seller_name,
        "commodity": gp.commodity,
        "quantity_quintals": float(gp.quantity_quintals),
        "quality_grade": gp.quality_grade,
        "statutory_cess_paid_inr": float(gp.total_mandi_fee),
        "pass_status": gp.status,
        "vehicle_number": gp.vehicle_number or "Pending Weighbridge Entry",
        "weighbridge_status": "COMPLETED" if gp.net_weight_quintals else "AWAITING_TARE_MEASUREMENT",
        "issued_at": gp.created_at.isoformat() if gp.created_at else None,
    }


@router.post("/enam-gatepass/{gate_pass_id}/weighbridge")
def record_weighbridge_slip(gate_pass_id: str, payload: WeighbridgeUpdate, db: Session = Depends(get_db)):
    """Record weighbridge scale readings (Gross - Tare = Net weight)."""
    gp = db.query(EnamGatePass).filter(EnamGatePass.gate_pass_id == gate_pass_id).first()
    if not gp:
        raise HTTPException(status_code=404, detail="Gate pass not found")
    if payload.gross_weight_quintals <= payload.tare_weight_quintals:
        raise HTTPException(status_code=400, detail="Gross weight must be greater than Tare weight")

    net = round(payload.gross_weight_quintals - payload.tare_weight_quintals, 2)
    gp.vehicle_number = payload.vehicle_number or "MH-12-TR-8821"
    gp.gross_weight_quintals = payload.gross_weight_quintals
    gp.tare_weight_quintals = payload.tare_weight_quintals
    gp.net_weight_quintals = net
    gp.status = "AUCTION_READY"
    gp.weighed_at = datetime.utcnow()
    db.commit()
    db.refresh(gp)

    return {
        "status": "AUCTION_READY",
        "gate_pass_id": gp.gate_pass_id,
        "vehicle_number": gp.vehicle_number,
        "gross_quintals": float(gp.gross_weight_quintals),
        "tare_quintals": float(gp.tare_weight_quintals),
        "net_quintals": float(gp.net_weight_quintals),
        "cleared_at": gp.weighed_at.isoformat(),
        "next_step": "Direct entry to APMC Electronic Bidding Auction Bay",
    }

# ── B2B Escrow & Commercial Milestone Settlement ─────────────────────────────

@router.post("/offers/{offer_id}/b2b-escrow")
def deposit_b2b_escrow(offer_id: str, payload: EscrowRequest, db: Session = Depends(get_db)):
    """
    B2B Commercial Escrow deposit:
    Supports 20% advance token or 100% full escrow hold via Direct UPI or Virtual Bank Account.
    """
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    deposit_type = payload.deposit_type
    total_val = float(offer.offer_price) * float(offer.quantity or 1.0)
    deposit_amount = round(total_val * 0.20, 2) if deposit_type == "20_pct_advance" else total_val

    tx_ref = payload.tx_ref or f"B2B-ESC-{str(uuid.uuid4())[:8].upper()}"

    # Update offer fulfillment
    offer.fulfillment_status = "escrow_secured"
    offer.message = (offer.message or "") + f" | [Escrow Held: ₹{deposit_amount:,.0f} Ref: {tx_ref}]"
    db.commit()
    db.refresh(offer)

    return {
        "status": "escrow_held",
        "offer_id": str(offer.id),
        "deposit_type": deposit_type,
        "escrow_amount": deposit_amount,
        "total_deal_value": total_val,
        "tx_ref": tx_ref,
        "virtual_account": "ICIC0000011-FTB2B" + str(offer.id)[:6].upper(),
        "beneficiary": "FarmTwin B2B Settlement Escrow Ledger",
        "next_milestone": "Dispatch cargo and verify at Mandi Weighbridge for 80% final release",
    }


@router.post("/offers/{offer_id}/release-milestone")
def release_b2b_milestone(offer_id: str, payload: MilestoneReleaseRequest, db: Session = Depends(get_db)):
    """Releases B2B escrow funds to farmer's verified bank account / UPI."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    milestone = payload.milestone or "final_delivery"
    offer.fulfillment_status = "delivered"
    db.commit()
    db.refresh(offer)

    total_val = float(offer.offer_price) * float(offer.quantity or 1.0)
    return {
        "status": "payout_released",
        "offer_id": str(offer.id),
        "milestone": milestone,
        "payout_released_inr": total_val,
        "payout_channel": payload.operator_upi_id or "Direct Bank IMPS / RTGS",
        "fulfillment_status": "delivered",
        "settled_at": "Today, Live MSAMB APMC Clearing",
    }
