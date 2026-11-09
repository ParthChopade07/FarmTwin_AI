"""Download & Benchmark Integration Helper for AgriTwin.

This script provides instructions and API download helpers to fetch raw datasets directly
from the top agricultural remote sensing repositories:

1. NASA Harvest CropHarvest (Global Ground-truth Crop Observations + Sentinel-2/Landsat)
2. Radiant Earth MLHub (Multi-spectral Satellite Data & Field Boundaries)
3. EuroCROP (Parcel-level Satellite Time Series)

Usage:
    python download_benchmarks.py --info
"""
import argparse
import sys

BENCHMARK_INFO = """
================================================================================
🌾 AGRITWIN REMOTE SENSING BENCHMARK DATASETS
================================================================================

1. NASA Harvest — CropHarvest
   • Website: https://github.com/nasaharvest/cropharvest
   • Python Library: pip install cropharvest
   • Content: Global crop type labels, parcel polygons, and aligned Sentinel-2 time series.
   • Features: Multi-temporal NDVI, EVI, NIR/Red bands, and planting/harvesting dates.

2. Radiant MLHub (Radiant Earth Foundation)
   • Website: https://mlhub.earth
   • Python Library: pip install radiant-mlhub
   • Content: Crop type classification datasets with ground-truth field boundaries.
   • Featured Collections:
       - radiant-mlhub/ref_african_crops_kenya_02
       - radiant-mlhub/ref_fusion_competition_south_africa

3. EuroCROP Parcel Dataset
   • Website: https://www.eurocrop.space
   • Content: Georeferenced agricultural parcel data aligned with EU Sentinel-2 tiles.
   • Features: Crop species annotations, spatial boundaries, and vegetation index trajectories.

================================================================================
"""

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--info", action="store_true", help="Print benchmark download info")
    args = parser.parse_args()

    print(BENCHMARK_INFO)

if __name__ == "__main__":
    main()
