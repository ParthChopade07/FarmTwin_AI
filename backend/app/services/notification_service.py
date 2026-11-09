import os
import smtplib
import urllib.parse
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any, List

def format_alert_sms_text(alert: Dict[str, Any]) -> str:
    """Format concise SMS for Indian farmers (under 160 chars or standard SMS limit)."""
    severity = alert.get("severity", "ALERT").upper()
    title = alert.get("title", "Farm Alert")
    action = alert.get("action", "Check FarmTwin app immediately.")
    return f"[FarmTwin {severity}] {title}. Action: {action} Details: https://farmtwin.ai/alerts"

def format_alert_email_html(alert: Dict[str, Any], recipient_email: str) -> str:
    """Generate professional responsive HTML email advisory."""
    severity = alert.get("severity", "WARNING").upper()
    category = alert.get("category", "Farm Alert")
    title = alert.get("title", "Farm Microclimate Alert")
    detail = alert.get("detail", "")
    action = alert.get("action", "Inspect field immediately.")
    
    badge_bg = "#b91c1c" if severity == "CRITICAL" else "#d97706" if severity in ["WARNING", "MODERATE"] else "#2563eb"
    
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FarmTwin Real-Time Alert</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #064e3b 0%, #022c22 100%); padding: 24px; color: #ffffff;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">🌱 FarmTwin AI Sentinel</h2>
        <span style="background: {badge_bg}; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 12px; text-transform: uppercase;">
          {severity}
        </span>
      </div>
      <p style="margin: 6px 0 0; font-size: 12px; color: #a7f3d0;">Automated Real-Time Telemetry & Outbreak Warning</p>
    </div>

    <!-- Alert Body -->
    <div style="padding: 24px;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">
        Category: {category}
      </div>
      <h3 style="margin: 0 0 12px; font-size: 18px; color: #0f172a; font-weight: 800;">
        {title}
      </h3>
      
      <div style="background-color: #f1f5f9; border-left: 4px solid {badge_bg}; padding: 14px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; line-height: 1.6; color: #334155;">
        {detail}
      </div>

      <!-- Action Box -->
      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <div style="font-size: 13px; font-weight: 800; color: #065f46; margin-bottom: 4px;">
          💡 Immediate Farmer Action Required:
        </div>
        <div style="font-size: 14px; color: #047857; font-weight: 600; line-height: 1.5;">
          {action}
        </div>
      </div>

      <!-- Button -->
      <div style="text-align: center; margin-top: 20px;">
        <a href="https://farmtwin.ai/alerts" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; box-shadow: 0 2px 6px rgba(5, 150, 105, 0.3);">
          Open FarmTwin Outbreak Radar &rarr;
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
      Dispatched to {recipient_email} &middot; FarmTwin AI Precision Agriculture &middot; 24x7 Real-Time Sentinel
    </div>
  </div>
</body>
</html>"""

def send_alert_email(alert: Dict[str, Any], recipient_email: str) -> Dict[str, Any]:
    """Send alert via standard Python SMTP (Gmail / SMTP Server)."""
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASSWORD", "")
    sender_email = os.getenv("SMTP_FROM", smtp_user or "alerts@farmtwin.ai")
    
    subject = f"[{alert.get('severity', 'ALERT').upper()}] {alert.get('title', 'FarmTwin Alert')}"
    html_content = format_alert_email_html(alert, recipient_email)
    
    if smtp_user and smtp_pass:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"FarmTwin Sentinel <{sender_email}>"
            msg["To"] = recipient_email
            
            # Plain text fallback
            text_part = MIMEText(format_alert_sms_text(alert), "plain")
            html_part = MIMEText(html_content, "html")
            msg.attach(text_part)
            msg.attach(html_part)
            
            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(sender_email, [recipient_email], msg.as_string())
                
            return {
                "status": "delivered",
                "channel": "email",
                "recipient": recipient_email,
                "provider": f"SMTP ({smtp_host})",
                "message": f"Real-time email delivered to {recipient_email}"
            }
        except Exception as e:
            return {
                "status": "failed",
                "channel": "email",
                "recipient": recipient_email,
                "provider": "Gmail Gateway",
                "error": str(e),
                "message": f"SMTP delivery failed: {e}"
            }
    else:
        return {
            "status": "unconfigured",
            "channel": "email",
            "recipient": recipient_email,
            "provider": "None",
            "message": "SMTP credentials not configured in backend/.env (Set SMTP_USER and SMTP_PASSWORD)"
        }

def send_alert_sms(alert: Dict[str, Any], phone_number: str) -> Dict[str, Any]:
    """Send SMS to mobile number via Fast2SMS / Indian AgTech Gateway or verified simulation."""
    sms_text = format_alert_sms_text(alert)
    fast2sms_key = os.getenv("FAST2SMS_API_KEY", "")
    
    cleaned_phone = "".join([c for c in phone_number if c.isdigit()])
    if len(cleaned_phone) > 10:
        cleaned_phone = cleaned_phone[-10:] # standard 10-digit Indian phone
        
    if fast2sms_key and len(cleaned_phone) == 10:
        try:
            import urllib.request
            import json
            
            url = "https://www.fast2sms.com/dev/bulkV2"
            payload = json.dumps({
                "route": "q",
                "message": sms_text,
                "language": "english",
                "flash": 0,
                "numbers": cleaned_phone,
            }).encode("utf-8")
            
            req = urllib.request.Request(
                url,
                data=payload,
                headers={
                    "authorization": fast2sms_key,
                    "Content-Type": "application/json",
                }
            )
            with urllib.request.urlopen(req, timeout=8) as response:
                res_data = json.loads(response.read().decode())
                return {
                    "status": "delivered",
                    "channel": "sms",
                    "recipient": phone_number,
                    "provider": "Fast2SMS India",
                    "response": res_data
                }
        except Exception as e:
            return {
                "status": "failed",
                "channel": "sms",
                "recipient": phone_number,
                "provider": "Fast2SMS India",
                "error": str(e),
                "sms_preview": sms_text
            }

    return {
        "status": "unconfigured",
        "channel": "sms",
        "recipient": phone_number,
        "provider": "None",
        "sms_preview": sms_text,
        "message": "SMS gateway not configured in backend/.env (Set FAST2SMS_API_KEY)"
    }

def generate_whatsapp_link(alert: Dict[str, Any], phone_number: str) -> str:
    """Generate direct WhatsApp URL with pre-filled advisory for 1-tap transmission."""
    cleaned_phone = "".join([c for c in phone_number if c.isdigit()])
    if len(cleaned_phone) == 10:
        cleaned_phone = "91" + cleaned_phone
    
    severity = alert.get("severity", "WARNING").upper()
    title = alert.get("title", "Farm Alert")
    detail = alert.get("detail", "")
    action = alert.get("action", "")
    
    msg = (
        f"🚨 *FARMTWIN AI REAL-TIME ALERT*\n\n"
        f"*Severity:* {severity}\n"
        f"*Alert:* {title}\n"
        f"*Detail:* {detail}\n\n"
        f"💡 *Action:* {action}\n\n"
        f"View Full Radar: https://farmtwin.ai/alerts"
    )
    encoded = urllib.parse.quote(msg)
    return f"https://api.whatsapp.com/send?phone={cleaned_phone}&text={encoded}"
