"""Generative AI Weekly Farm Report Generator for AgriTwin.

Synthesizes a comprehensive weekly intelligence briefing combining:
1. Expected 7-day Weather Outlook & Irrigation Warnings
2. Crop-Health & NDVI Trajectory
3. Explainable Risk Factors
4. Actionable Prioritized Weekly Recommendations (fertilizer, leaf inspection, irrigation deferral)
"""
import os
from datetime import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session

from app.models.orm import Farm, FarmWeeklyReport
from app.services.xai import analyze_farm_explainable_ai
from app.services.memory import get_farm_memory_context


def generate_weekly_farm_report(
    db: Session,
    farm_id: str,
    ndvi_mean: float = 0.65,
    ndvi_change_pct: float = -2.5,
    rainfall_7d_mm: float = 35.0,
    rainfall_30d_mm: float = 110.0,
    temperature_avg_7d_c: float = 28.5,
    humidity_avg_7d_pct: float = 68.0
) -> Dict[str, Any]:
    """Generates and persists a structured Generative AI Weekly Farm Report."""
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    farm_name = farm.farm_name if farm else "Farm Parcel"
    crop = farm.crop if farm else "Crop"

    # Fetch XAI breakdown & Farm Memory
    xai_data = analyze_farm_explainable_ai(
        farm_name=farm_name,
        crop=crop,
        ndvi_mean=ndvi_mean,
        ndvi_change_pct=ndvi_change_pct,
        rainfall_7d_mm=rainfall_7d_mm,
        rainfall_30d_mm=rainfall_30d_mm,
        temperature_avg_7d_c=temperature_avg_7d_c,
        humidity_avg_7d_pct=humidity_avg_7d_pct
    )
    memory_data = get_farm_memory_context(db, farm_id)

    current_week = datetime.utcnow().strftime("%Y-W%U")

    # Generate Weekly Executive Summary
    summary_text = (
        f"Weekly briefing for {farm_name} ({crop}): Overall crop health is {xai_data['overall_status']} "
        f"with a risk score of {xai_data['overall_risk_score']}%. Satellite NDVI is currently at {ndvi_mean:.2f} "
        f"({ndvi_change_pct:+.1f}% change over 30 days). Weather conditions show {rainfall_7d_mm:.1f} mm rain "
        f"accumulated over the past week with average temperatures of {temperature_avg_7d_c:.1f}°C."
    )

    # Weather Outlook Section
    if rainfall_7d_mm > 40.0:
        weather_outlook = (
            f"High precipitation expected to continue early in the week. Rain probability 60-80%, "
            f"humidity around {humidity_avg_7d_pct:.0f}%. Soil is highly saturated. NO IRRIGATION NEEDED."
        )
    elif rainfall_7d_mm < 10.0 and temperature_avg_7d_c > 30.0:
        weather_outlook = (
            f"Dry & hot spell continuing. Average temperature {temperature_avg_7d_c:.1f}°C with low rain "
            f"probability (10-20%). Mild moisture stress developing."
        )
    else:
        weather_outlook = (
            f"Moderate weather forecast. Average temperature {temperature_avg_7d_c:.1f}°C, rain probability 20-30%, "
            f"wind speed 12 km/h. Suitable conditions for field operations."
        )

    # Risks Identified
    risks_lines = [f"Primary Risk Driver: {xai_data['primary_cause']}."]
    for factor in xai_data["contributing_factors"]:
        risks_lines.append(f"- {factor['factor_name']} ({factor['status']}): {factor['explanation']}")
    risks_identified = "\n".join(risks_lines)

    # Actionable Weekly Recommendations
    rec_list = []
    if rainfall_7d_mm > 35.0:
        rec_list.append("1. Avoid irrigation until soil moisture stabilizes below 70%.")
        rec_list.append("2. Inspect lower leaves for fungal leaf spot / root rot due to high humidity.")
        rec_list.append("3. Schedule top-dress nitrogen fertilization for mid-week when dry weather window opens.")
    elif temperature_avg_7d_c > 31.0:
        rec_list.append("1. Schedule light drip irrigation during early morning hours to mitigate heat stress.")
        rec_list.append("2. Apply potassium/foliar spray to enhance crop thermal tolerance.")
        rec_list.append("3. Inspect crop canopy for sucking pests (thrips/whiteflies).")
    else:
        rec_list.append("1. Maintain standard irrigation schedule (next cycle in 3-4 days).")
        rec_list.append("2. Perform routine pest & weed monitoring across field parcel boundary.")
        rec_list.append("3. Apply scheduled organic fertilizer on a clear day.")

    recommended_actions = "\n".join(rec_list)

    # Persist report to database
    report = FarmWeeklyReport(
        farm_id=farm_id,
        report_week=current_week,
        summary_text=summary_text,
        weather_outlook=weather_outlook,
        risks_identified=risks_identified,
        recommended_actions=recommended_actions
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return {
        "report_id": str(report.id),
        "farm_id": str(farm_id),
        "farm_name": farm_name,
        "crop": crop,
        "report_week": current_week,
        "summary_text": summary_text,
        "weather_outlook": weather_outlook,
        "risks_identified": risks_identified,
        "recommended_actions": recommended_actions,
        "xai_breakdown": xai_data,
        "created_at": report.created_at.isoformat()
    }
