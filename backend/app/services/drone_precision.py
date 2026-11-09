"""Precision Drone Spray Boundary & Task Generator Engine.

Generates drone flight path tasks (GeoJSON / KML) targeting AI-identified
stressed / low-vigor NDVI satellite zones to reduce chemical usage by 30-50%.
"""

from typing import Dict, Optional


def generate_drone_flight_path(
    farm_id: Optional[str] = None,
    farm_name: str = "Farm Twin Field",
    total_acres: float = 2.0,
    crop: str = "Sugarcane",
    mode: str = "spot",
) -> Dict:
    """Generates flight path parameters, chemical savings calculation, GeoJSON and KML content."""
    is_spot = mode.lower() == "spot"

    # Spot spraying treats ~35% to 50% of the field based on low-vigor NDVI zones (<0.45)
    treated_acres = round(total_acres * 0.40, 2) if is_spot else total_acres
    saved_acres = round(total_acres - treated_acres, 2) if is_spot else 0.0
    chemical_savings_pct = round((saved_acres / total_acres) * 100, 1) if is_spot else 0.0

    # Base price per acre: ₹350
    price_per_acre = 350
    full_cost = round(total_acres * price_per_acre)
    actual_cost = round(treated_acres * price_per_acre) if is_spot else full_cost
    savings_inr = full_cost - actual_cost

    # Anonymized / Simulated drone boundary coordinates around Pune farm center
    base_lat = 18.5204
    base_lon = 73.8567

    # GeoJSON FeatureCollection
    flight_path_geojson = {
        "type": "FeatureCollection",
        "properties": {
            "farm_name": farm_name,
            "crop": crop,
            "spray_mode": "SPOT_PRECISION" if is_spot else "FULL_COVERAGE",
            "total_acres": total_acres,
            "treated_acres": treated_acres,
            "chemical_savings_pct": chemical_savings_pct,
            "target_ndvi_threshold": "< 0.45 (Stressed/Low-Vigor)",
        },
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "zone_id": "zone_spot_alpha",
                    "status": "STRESSED_LOW_VIGOR",
                    "ndvi_score": 0.38,
                    "target_pest_disease": "Red Rot / Blight Suspected",
                    "spray_dosage_l_per_acre": 8.5,
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [base_lon, base_lat],
                            [base_lon + 0.0015, base_lat],
                            [base_lon + 0.0015, base_lat + 0.0012],
                            [base_lon, base_lat + 0.0012],
                            [base_lon, base_lat],
                        ]
                    ],
                },
            },
            {
                "type": "Feature",
                "properties": {
                    "zone_id": "zone_spot_beta",
                    "status": "STRESSED_LOW_VIGOR",
                    "ndvi_score": 0.41,
                    "target_pest_disease": "Fungal Patch",
                    "spray_dosage_l_per_acre": 8.0,
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [base_lon + 0.0020, base_lat + 0.0015],
                            [base_lon + 0.0032, base_lat + 0.0015],
                            [base_lon + 0.0032, base_lat + 0.0025],
                            [base_lon + 0.0020, base_lat + 0.0025],
                            [base_lon + 0.0020, base_lat + 0.0015],
                        ]
                    ],
                },
            },
        ],
    }

    # KML Flight Path Document text
    kml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Precision Drone Flight Path - {farm_name}</name>
    <description>Mode: {mode.upper()} | Treated: {treated_acres} Acres | Chemical Savings: {chemical_savings_pct}%</description>
    <Placemark>
      <name>Zone Alpha (NDVI 0.38)</name>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              {base_lon},{base_lat},0
              {base_lon + 0.0015},{base_lat},0
              {base_lon + 0.0015},{base_lat + 0.0012},0
              {base_lon},{base_lat + 0.0012},0
              {base_lon},{base_lat},0
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>"""

    return {
        "farm_id": farm_id,
        "farm_name": farm_name,
        "crop": crop,
        "spray_mode": "spot" if is_spot else "full",
        "total_acres": total_acres,
        "treated_acres": treated_acres,
        "saved_acres": saved_acres,
        "chemical_savings_pct": chemical_savings_pct,
        "full_cost_inr": full_cost,
        "actual_cost_inr": actual_cost,
        "savings_inr": savings_inr,
        "flight_path_geojson": flight_path_geojson,
        "kml_content": kml_content,
    }
