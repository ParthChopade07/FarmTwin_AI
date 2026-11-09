"""Crop ROI & Season Profitability Simulator Service.

Simulates expected yield (Quintals/acre), input costs, projected gross revenue,
net profit, ROI percentage, and profit per acre under 3 weather scenarios
(Normal Monsoon, Drought, Heavy Rainfall).
"""

from typing import Dict, List, Optional
from app.services.market import BASE_PRICE_PER_QUINTAL

# Base expected yield per acre (Quintals/acre)
BASE_YIELD_PER_ACRE: Dict[str, float] = {
    "wheat": 18.0,
    "rice": 22.0,
    "paddy": 22.0,
    "maize": 20.0,
    "cotton": 12.0,
    "sugarcane": 350.0,
    "soybean": 10.0,
    "groundnut": 12.0,
    "mustard": 9.0,
    "potato": 110.0,
    "onion": 95.0,
    "tomato": 140.0,
    "gram": 8.5,
    "bajra": 11.0,
    "jowar": 10.0,
    "cauliflower": 85.0,
    "pumpkin": 90.0,
}

# Base estimated input cost per acre (INR) for standard cultivation
BASE_INPUT_COST_PER_ACRE: Dict[str, float] = {
    "wheat": 18000.0,
    "rice": 22000.0,
    "paddy": 22000.0,
    "maize": 15000.0,
    "cotton": 26000.0,
    "sugarcane": 45000.0,
    "soybean": 16000.0,
    "groundnut": 20000.0,
    "mustard": 14000.0,
    "potato": 38000.0,
    "onion": 35000.0,
    "tomato": 42000.0,
    "gram": 13000.0,
    "bajra": 12000.0,
    "jowar": 12500.0,
    "cauliflower": 28000.0,
    "pumpkin": 18000.0,
}

SEED_VARIETY_MODIFIERS = {
    "hyv": {
        "name": "Hybrid / High Yield Variety (HYV)",
        "yield_mult": 1.22,
        "seed_cost_mult": 1.35,
        "fert_mult": 1.15,
        "price_mult": 1.0,
    },
    "certified": {
        "name": "Certified Commercial Seed",
        "yield_mult": 1.10,
        "seed_cost_mult": 1.15,
        "fert_mult": 1.05,
        "price_mult": 1.0,
    },
    "local": {
        "name": "Local / Saved Seed",
        "yield_mult": 1.0,
        "seed_cost_mult": 0.70,
        "fert_mult": 1.0,
        "price_mult": 0.96,
    },
    "organic": {
        "name": "Organic Certified Seed",
        "yield_mult": 0.90,
        "seed_cost_mult": 1.25,
        "fert_mult": 0.75,
        "pest_mult": 0.35,
        "labor_mult": 1.30,
        "price_mult": 1.25,  # Premium market price
    },
}


def _get_crop_base_price(crop: str) -> float:
    crop_lower = (crop or "").strip().lower()
    return BASE_PRICE_PER_QUINTAL.get(crop_lower, 2200.0)


def _get_crop_base_yield(crop: str) -> float:
    crop_lower = (crop or "").strip().lower()
    return BASE_YIELD_PER_ACRE.get(crop_lower, 15.0)


def _get_crop_base_cost(crop: str) -> float:
    crop_lower = (crop or "").strip().lower()
    return BASE_INPUT_COST_PER_ACRE.get(crop_lower, 20000.0)


def simulate_crop_roi(
    crop: str,
    seed_type: str = "hyv",
    budget: float = 50000.0,
    acreage: float = 2.0,
    farm_id: Optional[str] = None,
    language: str = "en",
) -> Dict:
    """Computes season ROI & financial performance across 3 weather scenarios."""
    crop_clean = (crop or "Wheat").strip().capitalize()
    seed_clean = (seed_type or "hyv").strip().lower()
    if seed_clean not in SEED_VARIETY_MODIFIERS:
        seed_clean = "hyv"

    seed_mod = SEED_VARIETY_MODIFIERS[seed_clean]

    base_yield_acre = _get_crop_base_yield(crop_clean)
    base_cost_acre = _get_crop_base_cost(crop_clean)
    base_price_qtl = _get_crop_base_price(crop_clean) * seed_mod.get("price_mult", 1.0)

    # Base cost components per acre
    seed_cost_base = base_cost_acre * 0.18 * seed_mod.get("seed_cost_mult", 1.0)
    fert_cost_base = base_cost_acre * 0.28 * seed_mod.get("fert_mult", 1.0)
    water_cost_base = base_cost_acre * 0.18
    pest_cost_base = base_cost_acre * 0.16 * seed_mod.get("pest_mult", 1.0)
    labor_cost_base = base_cost_acre * 0.20 * seed_mod.get("labor_mult", 1.0)

    # Weather scenarios defined
    weather_scenarios_config = [
        {
            "id": "normal",
            "name": {
                "en": "Normal Monsoon (Optimal)",
                "hi": "सामान्य मानसून (अनुकूल)",
                "mr": "सामान्य मान्सून (अनुकूल)",
            },
            "icon": "🌧️",
            "yield_mult": 1.10 * seed_mod["yield_mult"],
            "price_mult": 1.0,
            "water_cost_mult": 1.0,
            "pest_cost_mult": 1.0,
            "desc": {
                "en": "Ideal rainfall distribution and moderate temperatures maximize yield.",
                "hi": "आदर्श वर्षा और संतुलित तापमान उपज को अधिकतम करते हैं।",
                "mr": "योग्य पाऊस आणि संतुलित तापमान उत्पादन जास्तीत जास्त वाढवते.",
            },
        },
        {
            "id": "drought",
            "name": {
                "en": "Drought / Deficit Monsoon",
                "hi": "सूखा / कम वर्षा",
                "mr": "दुष्काळ / कमी पाऊस",
            },
            "icon": "☀️",
            "yield_mult": 0.68 * seed_mod["yield_mult"],
            "price_mult": 1.22,  # Scarcity raises mandi prices
            "water_cost_mult": 1.35,  # Higher irrigation/diesel pumping cost
            "pest_cost_mult": 0.90,
            "desc": {
                "en": "Water stress reduces yield, but market prices surge due to supply shortage.",
                "hi": "पानी की कमी से उपज घटती है, लेकिन कमी के कारण मंडी भाव बढ़ते हैं।",
                "mr": "पाण्याच्या टंचाईने उत्पादन घटते, परंतु बाजारातील तुटवड्यामुळे दर वाढतात.",
            },
        },
        {
            "id": "heavy_rain",
            "name": {
                "en": "Heavy / Excess Rainfall",
                "hi": "अत्यधिक वर्षा / जलभराव",
                "mr": "अतिवृष्टी / साचलेले पाणी",
            },
            "icon": "⛈️",
            "yield_mult": 0.78 * seed_mod["yield_mult"],
            "price_mult": 1.08,
            "water_cost_mult": 0.70,
            "pest_cost_mult": 1.45,  # Higher fungicide and disease management
            "desc": {
                "en": "Waterlogging increases fungal infection risks, raising crop protection costs.",
                "hi": "जलभराव से फफूंद संक्रमण का खतरा बढ़ता है, जिससे कीटनाशक खर्च बढ़ता है।",
                "mr": "पाणी साचल्यामुळे बुरशीजन्य रोगांचा धोका वाढतो आणि फवारणीचा खर्च वाढतो.",
            },
        },
    ]

    scenarios = []

    for sc in weather_scenarios_config:
        sc_yield_per_acre = round(base_yield_acre * sc["yield_mult"], 1)
        total_yield_qtl = round(sc_yield_per_acre * acreage, 1)

        sc_seed_cost = seed_cost_base
        sc_fert_cost = fert_cost_base
        sc_water_cost = water_cost_base * sc["water_cost_mult"]
        sc_pest_cost = pest_cost_base * sc["pest_cost_mult"]
        sc_labor_cost = labor_cost_base

        sc_input_cost_per_acre = round(
            sc_seed_cost + sc_fert_cost + sc_water_cost + sc_pest_cost + sc_labor_cost,
            -1,
        )
        total_input_cost = round(sc_input_cost_per_acre * acreage, -1)

        mandi_price_qtl = round(base_price_qtl * sc["price_mult"], -1)
        gross_revenue = round(total_yield_qtl * mandi_price_qtl, -1)
        net_profit = round(gross_revenue - total_input_cost, -1)
        profit_per_acre = round(net_profit / max(0.1, acreage), -1)

        roi_pct = round(
            ((gross_revenue - total_input_cost) / max(1.0, total_input_cost)) * 100, 1
        )

        # Risk level determination
        if roi_pct > 35:
            risk_level = "LOW"
            risk_badge = "Healthy ROI"
        elif roi_pct >= 10:
            risk_level = "MODERATE"
            risk_badge = "Moderate Return"
        elif roi_pct >= -15:
            risk_level = "HIGH"
            risk_badge = "High Financial Risk"
        else:
            risk_level = "CRITICAL"
            risk_badge = "Severe Loss Risk"

        budget_diff = round(budget - total_input_cost, -1)
        budget_status = (
            f"Within Budget (+₹{int(budget_diff):,})"
            if budget_diff >= 0
            else f"Budget Deficit (-₹{int(abs(budget_diff)):,})"
        )

        lang_key = language if language in ["en", "hi", "mr"] else "en"

        scenarios.append({
            "id": sc["id"],
            "name": sc["name"][lang_key],
            "icon": sc["icon"],
            "description": sc["desc"][lang_key],
            "yield_per_acre_qtl": sc_yield_per_acre,
            "total_yield_qtl": total_yield_qtl,
            "input_cost_per_acre": sc_input_cost_per_acre,
            "total_input_cost": total_input_cost,
            "budget_status": budget_status,
            "is_budget_sufficient": budget_diff >= 0,
            "mandi_price_per_qtl": mandi_price_qtl,
            "gross_revenue": gross_revenue,
            "net_profit": net_profit,
            "profit_per_acre": profit_per_acre,
            "roi_percentage": roi_pct,
            "risk_level": risk_level,
            "risk_badge": risk_badge,
            "cost_breakdown": {
                "seed": round(sc_seed_cost * acreage, -1),
                "fertilizer": round(sc_fert_cost * acreage, -1),
                "water_irrigation": round(sc_water_cost * acreage, -1),
                "pesticide_care": round(sc_pest_cost * acreage, -1),
                "labor_machinery": round(sc_labor_cost * acreage, -1),
            },
        })

    # AI Decision & Feasibility Summary
    normal_sc = next(s for s in scenarios if s["id"] == "normal")
    total_normal_cost = normal_sc["total_input_cost"]
    break_even_price = round(total_normal_cost / max(1.0, normal_sc["total_yield_qtl"]), -1)

    if budget >= total_normal_cost:
        feasibility = "FEASIBLE"
        feasibility_title = {
            "en": "🟢 Highly Feasible Sowing Plan",
            "hi": "🟢 अत्यधिक व्यवहार्य बुआई योजना",
            "mr": "🟢 अत्यंत शक्य पेरणी योजना",
        }[language if language in ["en", "hi", "mr"] else "en"]
    else:
        feasibility = "BUDGET_SHORTAGE"
        feasibility_title = {
            "en": "⚠️ Budget Shortage Alert",
            "hi": "⚠️ बजट कमी चेतावनी",
            "mr": "⚠️ बजेट तुटवडा इशारा",
        }[language if language in ["en", "hi", "mr"] else "en"]

    suitability_score = min(98, max(45, int(70 + (normal_sc["roi_percentage"] / 2))))

    # Risk mitigation tips
    if language == "hi":
        mitigation_tips = [
            f"ब्रेक-ईवन मंडी मूल्य: ₹{int(break_even_price):,}/क्विंटल। इससे ऊपर बिक्री करने पर शुद्ध लाभ होगा।",
            "सूखे के जोखिम को 40% तक कम करने के लिए ड्रिप सिंचाई और मल्चिंग अपनाएं।",
            "अत्यधिक वर्षा से बचने के लिए जल निकासी चैनल तैयार रखें।",
        ]
    elif language == "mr":
        mitigation_tips = [
            f"ब्रेक-इव्हन मंडी दर: ₹{int(break_even_price):,}/क्विंटल. यापेक्षा जास्त दरावर विक्री केल्यास निव्वळ नफा होईल.",
            "दुष्काळाचा धोका ४०% कमी करण्यासाठी ठिबक सिंचन आणि आच्छादन (mulching) वापरा.",
            "अतिवृष्टीचे नुकसान टाळण्यासाठी योग्य पाण्याचा निचरा व्यवस्था सज्ज ठेवा.",
        ]
    else:
        mitigation_tips = [
            f"Break-even mandi price is ₹{int(break_even_price):,}/Quintal. Any market sale above this guarantees net profit.",
            "Adopt micro-drip irrigation to buffer against drought yield drop by up to 35%.",
            "Ensure field drainage furrows to protect root systems during heavy monsoon spells.",
        ]

    return {
        "crop": crop_clean,
        "seed_type_name": seed_mod["name"],
        "acreage": acreage,
        "user_budget": budget,
        "break_even_price_per_qtl": break_even_price,
        "suitability_score": suitability_score,
        "feasibility": feasibility,
        "feasibility_title": feasibility_title,
        "normal_scenario_roi": normal_sc["roi_percentage"],
        "normal_net_profit": normal_sc["net_profit"],
        "scenarios": scenarios,
        "mitigation_tips": mitigation_tips,
        "currency": "INR",
    }
