"""Explainable AI (XAI) Service for AgriTwin.

This service converts ML predictions and environmental telemetry into 
human-understandable factor attributions. Instead of returning only a raw risk score,
it breaks down the exact physical and climatological drivers behind the risk.

Example Output:
- Overall Stress/Flood Risk Score: 78% (High)
- Contributing Factors:
  1. Heavy Rainfall (85mm 7d total) -> +35% impact
  2. High Soil Saturation (82% moisture) -> +25% impact
  3. Low Parcel Elevation / Flat Slope -> +15% impact
  4. Satellite NDVI Drop (-14% 30d decline) -> +10% impact
"""
from typing import Dict, List, Any


def analyze_farm_explainable_ai(
    farm_name: str,
    crop: str,
    ndvi_mean: float,
    ndvi_change_pct: float,
    rainfall_7d_mm: float,
    rainfall_30d_mm: float,
    temperature_avg_7d_c: float,
    humidity_avg_7d_pct: float,
    soil_moisture_pct: float = 65.0,
    elevation_meters: float = 120.0
) -> Dict[str, Any]:
    """Computes Explainable AI risk scores and factor attribution explanations."""
    factors: List[Dict[str, Any]] = []
    total_risk_score = 0.0

    # 1. Flood Risk Factor Attribution
    if rainfall_7d_mm > 60.0 or rainfall_30d_mm > 150.0:
        impact = min(40.0, (rainfall_7d_mm / 100.0) * 40.0)
        total_risk_score += impact
        factors.append({
            "factor_name": "Heavy Rainfall Accumulation",
            "category": "Weather",
            "impact_weight": round(impact, 1),
            "status": "High Risk",
            "explanation": f"7-day rainfall reached {rainfall_7d_mm:.1f} mm ({rainfall_30d_mm:.1f} mm 30-day total), overloading soil drainage."
        })

    if soil_moisture_pct > 75.0:
        impact = min(25.0, ((soil_moisture_pct - 70.0) / 30.0) * 25.0)
        total_risk_score += impact
        factors.append({
            "factor_name": "High Soil Saturation",
            "category": "Soil",
            "impact_weight": round(impact, 1),
            "status": "High Risk",
            "explanation": f"Soil moisture saturation at {soil_moisture_pct:.1f}%, limiting oxygen uptake at root level."
        })

    # 2. Drought & Heat Stress Attribution
    if rainfall_7d_mm < 10.0 and temperature_avg_7d_c > 32.0:
        impact = min(35.0, ((32.0 - rainfall_7d_mm) / 30.0) * 20.0 + ((temperature_avg_7d_c - 30.0) / 10.0) * 15.0)
        total_risk_score += impact
        factors.append({
            "factor_name": "Drought & Extreme Thermal Stress",
            "category": "Climate",
            "impact_weight": round(impact, 1),
            "status": "High Risk",
            "explanation": f"Severe dry spell ({rainfall_7d_mm:.1f} mm rain) combined with high weekly temperatures ({temperature_avg_7d_c:.1f}°C)."
        })

    # 3. Satellite Vegetation Drop Attribution
    if ndvi_change_pct < -5.0:
        impact = min(30.0, abs(ndvi_change_pct) * 1.5)
        total_risk_score += impact
        factors.append({
            "factor_name": "Satellite NDVI Decline",
            "category": "Satellite Sentinel-2",
            "impact_weight": round(impact, 1),
            "status": "Decline Detected",
            "explanation": f"Sentinel-2 vegetation vigor index dropped by {abs(ndvi_change_pct):.1f}% over the last observation cycle."
        })
    elif ndvi_mean < 0.45:
        impact = 20.0
        total_risk_score += impact
        factors.append({
            "factor_name": "Low Chlorophyll & Biomass Density",
            "category": "Satellite Sentinel-2",
            "impact_weight": impact,
            "status": "Below Baseline",
            "explanation": f"Mean NDVI is low ({ndvi_mean:.2f}), indicating sparse canopy cover or nutrient deficiency."
        })

    # 4. Elevation / Topography Drainage Risk Factor
    if elevation_meters < 150.0 and rainfall_7d_mm > 40.0:
        impact = 15.0
        total_risk_score += impact
        factors.append({
            "factor_name": "Low Elevation & Flat Slope",
            "category": "Topography",
            "impact_weight": impact,
            "status": "Moderate Risk",
            "explanation": f"Parcel elevation is low ({elevation_meters:.0f}m), increasing water retention and nearby river run-off risk."
        })

    # If conditions are favorable
    if not factors:
        factors.append({
            "factor_name": "Optimal Growing Conditions",
            "category": "Balanced Environment",
            "impact_weight": 0.0,
            "status": "Optimal",
            "explanation": f"Favorable NDVI ({ndvi_mean:.2f}), moderate temperature ({temperature_avg_7d_c:.1f}°C), and adequate moisture ({rainfall_7d_mm:.1f} mm 7d rain)."
        })

    final_risk_score = min(99.0, max(5.0, round(total_risk_score, 1)))

    if final_risk_score >= 65.0:
        overall_status = "High Stress / Risk"
        primary_cause = factors[0]["factor_name"] if factors else "Combined Climate Pressure"
    elif final_risk_score >= 35.0:
        overall_status = "Moderate Stress"
        primary_cause = factors[0]["factor_name"] if factors else "Sub-optimal Moisture"
    else:
        overall_status = "Low Stress / Healthy"
        primary_cause = "Optimal Conditions"

    return {
        "farm_name": farm_name,
        "crop": crop,
        "overall_risk_score": final_risk_score,
        "overall_status": overall_status,
        "primary_cause": primary_cause,
        "contributing_factors": factors,
        "xai_summary": f"{farm_name} ({crop}) overall risk is {final_risk_score}% ({overall_status}) primarily driven by {primary_cause.lower()}."
    }
