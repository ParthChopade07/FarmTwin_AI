"""
SMS Dispatch Service — FarmTwin
================================
Uses Textbelt (https://textbelt.com) for FREE SMS delivery.
  • key="textbelt"  →  1 free SMS per day, globally, no signup
  • key="textbelt_test" → test mode (no SMS sent, instant success response)

For production: buy credits at textbelt.com (≈ $0.009 / SMS = ~₹0.75)
No registration, no GST, no KYC required.
"""

import os
import logging
import requests
from datetime import datetime

logger = logging.getLogger(__name__)

TEXTBELT_KEY = os.getenv("TEXTBELT_KEY", "textbelt")   # "textbelt" = 1 free/day
TEXTBELT_URL = "https://textbelt.com/text"


def send_sms(phone: str, message: str) -> dict:
    """
    Send a real SMS via Textbelt free API.
    Phone format: E.164 — e.g., "+919823045120"
    Returns: {"success": bool, "textId": str, "quotaRemaining": int, "error": str|None}
    """
    # Normalise Indian numbers: "+91 98230 45120" → "+919823045120"
    clean_phone = phone.replace(" ", "").replace("-", "")
    if not clean_phone.startswith("+"):
        clean_phone = "+91" + clean_phone.lstrip("0")

    try:
        resp = requests.post(
            TEXTBELT_URL,
            data={
                "phone": clean_phone,
                "message": message,
                "key": TEXTBELT_KEY,
            },
            timeout=10,
        )
        result = resp.json()
        if result.get("success"):
            logger.info(f"[SMS] Sent to {clean_phone} | textId={result.get('textId')} | quota={result.get('quotaRemaining')}")
        else:
            logger.warning(f"[SMS] Failed to {clean_phone}: {result.get('error')}")
        return result
    except Exception as exc:
        logger.error(f"[SMS] Exception sending to {clean_phone}: {exc}")
        return {"success": False, "error": str(exc), "quotaRemaining": 0}


def send_operator_dispatch_sms(operator_name: str, operator_phone: str,
                                service_name: str, area: float,
                                scheduled_date: str, booking_id: str,
                                payout: float) -> dict:
    """Build and send the dispatch SMS to an operator."""
    short_id = str(booking_id)[:8].upper()
    message = (
        f"[FarmTwin] New Job Alert!\n"
        f"Service: {service_name}\n"
        f"Area: {area} Acres | Date: {scheduled_date}\n"
        f"Your Payout: Rs {payout:.0f}\n"
        f"Booking: #{short_id}\n"
        f"Reply ACCEPT to +91-farmtwin or call farmer.\n"
        f"Platform: farmtwin.ai"
    )
    return send_sms(operator_phone, message)


def send_farmer_confirmation_sms(farmer_phone: str, service_name: str,
                                  operator_name: str, operator_phone: str,
                                  scheduled_date: str, escrow_amount: float) -> dict:
    """Send booking confirmation SMS to the farmer."""
    message = (
        f"[FarmTwin] Booking Confirmed!\n"
        f"Service: {service_name}\n"
        f"Operator: {operator_name}\n"
        f"Contact: {operator_phone}\n"
        f"Date: {scheduled_date}\n"
        f"Escrow Held: Rs {escrow_amount:.0f} (released after service)\n"
        f"farmtwin.ai"
    )
    return send_sms(farmer_phone, message)
