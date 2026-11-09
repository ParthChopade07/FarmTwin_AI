"""
WhatsApp Dispatch Service — FarmTwin
======================================
Two-mode operation:
  MODE A (Auto / Production): Twilio WhatsApp Business API
      Requires: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
      Free sandbox: https://console.twilio.com → Messaging → WhatsApp Sandbox
      Free credits: $15.50 on signup — ~2,500 WhatsApp messages

  MODE B (Prototype / No-Key): Generates a wa.me deep-link URL that
      opens WhatsApp with the message pre-filled. Farmer/operator taps Send.
      Zero cost, zero credentials, works instantly.

The system auto-detects mode based on env vars.
"""

import os
import logging
import urllib.parse

logger = logging.getLogger(__name__)

TWILIO_ACCOUNT_SID  = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN   = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")  # Twilio sandbox number


def _is_twilio_configured() -> bool:
    return bool(TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and
                TWILIO_ACCOUNT_SID != "YOUR_TWILIO_SID")


def send_whatsapp(to_phone: str, message: str) -> dict:
    """
    Send WhatsApp message.
    If Twilio creds are present → real send via Twilio API.
    Otherwise → return pre-filled wa.me deep-link URL.
    """
    clean_phone = to_phone.replace(" ", "").replace("-", "")
    if not clean_phone.startswith("+"):
        clean_phone = "+91" + clean_phone.lstrip("0")

    if _is_twilio_configured():
        return _send_via_twilio(clean_phone, message)
    else:
        return _generate_deeplink(clean_phone, message)


def _send_via_twilio(to_phone: str, message: str) -> dict:
    """Send via Twilio WhatsApp Business API (production mode)."""
    try:
        from twilio.rest import Client
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        msg = client.messages.create(
            body=message,
            from_=TWILIO_WHATSAPP_FROM,
            to=f"whatsapp:{to_phone}",
        )
        logger.info(f"[WhatsApp/Twilio] Sent to {to_phone} | SID={msg.sid} | Status={msg.status}")
        return {
            "mode": "twilio",
            "success": True,
            "message_sid": msg.sid,
            "status": msg.status,
            "to": to_phone,
        }
    except ImportError:
        logger.warning("[WhatsApp] twilio package not installed — falling back to deep-link")
        return _generate_deeplink(to_phone, message)
    except Exception as exc:
        logger.error(f"[WhatsApp/Twilio] Error: {exc}")
        return {"mode": "twilio", "success": False, "error": str(exc),
                "deeplink": _generate_deeplink(to_phone, message)["deeplink_url"]}


def _generate_deeplink(to_phone: str, message: str) -> dict:
    """Generate a wa.me pre-filled deep-link (zero-cost fallback)."""
    number = to_phone.lstrip("+")
    encoded = urllib.parse.quote(message)
    url = f"https://wa.me/{number}?text={encoded}"
    logger.info(f"[WhatsApp/DeepLink] Generated for {to_phone}")
    return {
        "mode": "deeplink",
        "success": True,
        "deeplink_url": url,
        "note": "Set TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN to enable auto-send",
    }


def build_dispatch_message(service_name: str, farmer_name: str,
                            crop: str, area: float, scheduled_date: str,
                            payout: float, booking_id: str) -> str:
    short_id = str(booking_id)[:8].upper()
    job_link = f"http://localhost:5173/operator/job/{booking_id}"
    return (
        f"🚨 *FarmTwin Job Dispatch Alert* 🚨\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"📋 *Service:* {service_name}\n"
        f"🌾 *Crop:* {crop} | 📐 *Area:* {area} Acres\n"
        f"📅 *Date:* {scheduled_date}\n"
        f"💰 *Your Guaranteed Payout:* ₹{payout:.0f}\n"
        f"🔒 *Escrow Status:* HELD BY FARMTWIN\n"
        f"🔑 *Booking ID:* #{short_id}\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"👉 *Tap to Accept & View Map:*\n{job_link}\n\n"
        f"Reply *ACCEPT* to confirm via WhatsApp.\n"
        f"_Platform: farmtwin.ai • Real-World Farm Mechanization_"
    )
