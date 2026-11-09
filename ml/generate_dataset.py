"""Generate a Multi-Source Benchmark-Enriched Training Dataset for AgriTwin.

This script synthesizes and integrates data distributions modeled after three world-leading 
open satellite & agricultural benchmarks:
1. NASA Harvest CropHarvest (Global Sentinel-2/Landsat phenology & growth stages)
2. Radiant Earth MLHub (Smallholder parcel dynamics, multi-spectral index variations)
3. EuroCROP (Parcel-level multi-temporal Sentinel-2 features across European climate zones)

Usage:
    python generate_dataset.py [--rows 5000] [--out dataset.csv] [--seed 42]
"""
import argparse
import numpy as np
import pandas as pd

SOURCES = ["NASA_CropHarvest", "Radiant_MLHub", "EuroCROP"]

CROP_BENCHMARKS = {
    "Soybean": {"ndvi_max": 0.86, "drought_sens": 1.0, "opt_temp": 28, "growth_days": 120},
    "Cotton": {"ndvi_max": 0.81, "drought_sens": 0.85, "opt_temp": 32, "growth_days": 150},
    "Wheat": {"ndvi_max": 0.79, "drought_sens": 0.65, "opt_temp": 22, "growth_days": 110},
    "Sugarcane": {"ndvi_max": 0.89, "drought_sens": 1.15, "opt_temp": 30, "growth_days": 360},
    "Rice": {"ndvi_max": 0.91, "drought_sens": 0.50, "opt_temp": 31, "growth_days": 130},
    "Maize": {"ndvi_max": 0.88, "drought_sens": 0.90, "opt_temp": 26, "growth_days": 125},
}


def generate_benchmark_dataset(n_rows: int = 5000, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    crops = list(CROP_BENCHMARKS.keys())

    rows = []
    for _ in range(n_rows):
        source = rng.choice(SOURCES, p=[0.4, 0.35, 0.25])
        crop = rng.choice(crops)
        profile = CROP_BENCHMARKS[crop]

        # Source-specific climate & sensor characteristics
        if source == "NASA_CropHarvest":
            # Global diverse climate ranges
            temp = float(rng.normal(26, 6))
            rain_7d = max(0.0, float(rng.normal(28, 22)))
            rain_30d = max(rain_7d, float(rng.normal(85, 45)))
            humidity = float(np.clip(rng.normal(60, 15), 15, 95))
            noise_std = 0.03  # High quality Sentinel-2 processing
        elif source == "Radiant_MLHub":
            # Tropical / Semi-arid smallholder dynamics (higher climate variance)
            temp = float(rng.normal(30, 5))
            rain_7d = max(0.0, float(rng.normal(20, 25)))
            rain_30d = max(rain_7d, float(rng.normal(65, 50)))
            humidity = float(np.clip(rng.normal(50, 18), 10, 90))
            noise_std = 0.05  # Small parcel edge noise
        else:  # EuroCROP
            # Temperate European climate zones
            temp = float(rng.normal(20, 4))
            rain_7d = max(0.0, float(rng.normal(35, 18)))
            rain_30d = max(rain_7d, float(rng.normal(105, 35)))
            humidity = float(np.clip(rng.normal(70, 12), 30, 98))
            noise_std = 0.02  # Precise European parcel boundaries

        crop_age_days = int(rng.integers(15, profile["growth_days"]))

        # Phenology Growth Curve (Bell-shaped curve: emergence -> peak -> senescence)
        progress = crop_age_days / profile["growth_days"]
        phenology_factor = np.sin(np.pi * np.clip(progress, 0.05, 0.95))

        # Drought & Heat Stress Calculation
        drought_stress = max(0.0, (35.0 - rain_7d) / 35.0) * profile["drought_sens"]
        heat_stress = max(0.0, (temp - profile["opt_temp"]) / 8.0)
        total_stress = np.clip(drought_stress + heat_stress, 0.0, 1.6)

        # NDVI calculation based on phenology and stress
        base_ndvi = profile["ndvi_max"] * phenology_factor
        ndvi_mean = base_ndvi - (0.32 * total_stress) + rng.normal(0, noise_std)
        ndvi_mean = float(np.clip(ndvi_mean, 0.05, 0.95))

        # Prior NDVI observation to compute realistic time-series delta (%)
        prior_ndvi = ndvi_mean + (0.04 * total_stress) + rng.normal(0, 0.04)
        prior_ndvi = float(np.clip(prior_ndvi, 0.05, 0.95))
        ndvi_change_pct = ((ndvi_mean - prior_ndvi) / prior_ndvi) * 100.0 if prior_ndvi > 0 else 0.0

        # Health labeling: 0=Stressed, 1=Moderate, 2=Healthy
        if ndvi_mean >= 0.58 and total_stress < 0.45:
            health = 2  # healthy
        elif ndvi_mean < 0.38 or total_stress > 0.85:
            health = 0  # stressed
        else:
            health = 1  # moderate

        # Realistic label noise (3% perturbation)
        if rng.random() < 0.03:
            health = int(np.clip(health + rng.choice([-1, 1]), 0, 2))

        rows.append(
            {
                "ndvi_mean": round(ndvi_mean, 4),
                "ndvi_change_pct": round(ndvi_change_pct, 2),
                "rainfall_7d_mm": round(rain_7d, 1),
                "rainfall_30d_mm": round(rain_30d, 1),
                "temperature_avg_7d_c": round(temp, 2),
                "humidity_avg_7d_pct": round(humidity, 1),
                "crop_type": crop,
                "crop_age_days": crop_age_days,
                "dataset_source": source,
                "health": health,
            }
        )

    return pd.DataFrame(rows)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--rows", type=int, default=5000)
    parser.add_argument("--out", type=str, default="dataset.csv")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    df = generate_benchmark_dataset(args.rows, seed=args.seed)
    df.to_csv(args.out, index=False)
    print(f"[OK] Generated {len(df)} multi-benchmark agricultural rows -> {args.out}")
    print("\nBreakdown by Dataset Benchmark Source:")
    print(df["dataset_source"].value_counts())
    print("\nBreakdown by Health Status:")
    print(df["health"].value_counts().rename({0: "Stressed (0)", 1: "Moderate (1)", 2: "Healthy (2)"}))
