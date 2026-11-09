"""Geometry helpers for farm boundaries and reverse geocoding.

Farm boundaries arrive from the frontend as GeoJSON (lon/lat, EPSG:4326).
We store them as PostGIS geometry and need to compute an approximate
area in acres for display. A simple equirectangular projection centred
on the polygon is accurate enough for single-field parcels.
"""
import math
import logging
from typing import Dict, List, Optional
import requests
from shapely.geometry import shape, mapping
from shapely.ops import transform

logger = logging.getLogger(__name__)

# Key Agricultural District Centroids for instant offline resolution
MAHARASHTRA_DISTRICTS = [
    {"name": "Satara", "lat": 17.6805, "lon": 73.9994, "mandi": "Satara APMC Yard", "state": "Maharashtra"},
    {"name": "Pune", "lat": 18.5204, "lon": 73.8567, "mandi": "Pune APMC Yard", "state": "Maharashtra"},
    {"name": "Kolhapur", "lat": 16.7050, "lon": 74.2433, "mandi": "Kolhapur APMC Yard", "state": "Maharashtra"},
    {"name": "Sangli", "lat": 16.8524, "lon": 74.5815, "mandi": "Sangli APMC Yard", "state": "Maharashtra"},
    {"name": "Solapur", "lat": 17.6599, "lon": 75.9064, "mandi": "Solapur APMC Yard", "state": "Maharashtra"},
    {"name": "Ahmednagar", "lat": 19.0948, "lon": 74.7480, "mandi": "Ahmednagar APMC Yard", "state": "Maharashtra"},
    {"name": "Nashik", "lat": 19.9975, "lon": 73.7898, "mandi": "Lasalgaon APMC Yard", "state": "Maharashtra"},
    {"name": "Chhatrapati Sambhajinagar", "lat": 19.8762, "lon": 75.3433, "mandi": "Jadhavwadi APMC Yard", "state": "Maharashtra"},
    {"name": "Jalgaon", "lat": 21.0077, "lon": 75.5626, "mandi": "Jalgaon APMC Yard", "state": "Maharashtra"},
    {"name": "Nagpur", "lat": 21.1458, "lon": 79.0882, "mandi": "Kalamna APMC Yard", "state": "Maharashtra"},
    {"name": "Amravati", "lat": 20.9320, "lon": 77.7523, "mandi": "Amravati APMC Yard", "state": "Maharashtra"},
    {"name": "Latur", "lat": 18.4088, "lon": 76.5604, "mandi": "Latur APMC Yard", "state": "Maharashtra"},
    {"name": "Nanded", "lat": 19.1534, "lon": 77.3090, "mandi": "Nanded APMC Yard", "state": "Maharashtra"},
    {"name": "Beed", "lat": 18.9891, "lon": 75.7601, "mandi": "Beed APMC Yard", "state": "Maharashtra"},
    {"name": "Parbhani", "lat": 19.2683, "lon": 76.7725, "mandi": "Parbhani APMC Yard", "state": "Maharashtra"},
    {"name": "Jalna", "lat": 19.8410, "lon": 75.8864, "mandi": "Jalna APMC Yard", "state": "Maharashtra"},
    {"name": "Dharashiv", "lat": 18.1856, "lon": 76.0419, "mandi": "Dharashiv APMC Yard", "state": "Maharashtra"},
    {"name": "Ratnagiri", "lat": 16.9902, "lon": 73.3120, "mandi": "Ratnagiri APMC Yard", "state": "Maharashtra"},
    {"name": "Sindhudurg", "lat": 16.1668, "lon": 73.7431, "mandi": "Kudal APMC Yard", "state": "Maharashtra"},
    {"name": "Raigad", "lat": 18.5158, "lon": 73.1812, "mandi": "Panvel APMC Yard", "state": "Maharashtra"},
    {"name": "Thane", "lat": 19.2183, "lon": 72.9781, "mandi": "Kalyan APMC Yard", "state": "Maharashtra"},
    {"name": "Dhule", "lat": 20.9042, "lon": 74.7749, "mandi": "Dhule APMC Yard", "state": "Maharashtra"},
    {"name": "Nandurbar", "lat": 21.3712, "lon": 74.2415, "mandi": "Nandurbar APMC Yard", "state": "Maharashtra"},
    {"name": "Buldhana", "lat": 20.5312, "lon": 76.1824, "mandi": "Malkapur APMC Yard", "state": "Maharashtra"},
    {"name": "Akola", "lat": 20.7002, "lon": 77.0082, "mandi": "Akola APMC Yard", "state": "Maharashtra"},
    {"name": "Washim", "lat": 20.1112, "lon": 77.1354, "mandi": "Washim APMC Yard", "state": "Maharashtra"},
    {"name": "Yavatmal", "lat": 20.3888, "lon": 78.1204, "mandi": "Yavatmal APMC Yard", "state": "Maharashtra"},
    {"name": "Wardha", "lat": 20.7453, "lon": 78.6022, "mandi": "Hinganghat APMC Yard", "state": "Maharashtra"},
    {"name": "Chandrapur", "lat": 19.9615, "lon": 79.2961, "mandi": "Chandrapur APMC Yard", "state": "Maharashtra"},
    {"name": "Gadchiroli", "lat": 20.1804, "lon": 79.9948, "mandi": "Gadchiroli APMC Yard", "state": "Maharashtra"},
    {"name": "Bhandara", "lat": 21.1714, "lon": 79.6548, "mandi": "Bhandara APMC Yard", "state": "Maharashtra"},
    {"name": "Gondia", "lat": 21.4604, "lon": 80.2012, "mandi": "Gondia APMC Yard", "state": "Maharashtra"},
]

_location_cache: Dict[str, Dict] = {}


def get_location_for_coords(lat: float, lon: float) -> Dict[str, str]:
    """Resolves latitude/longitude into human-readable District, Location, and State."""
    cache_key = f"{round(lat, 4)}_{round(lon, 4)}"
    if cache_key in _location_cache:
        return _location_cache[cache_key]

    # 1. Try BigDataCloud reverse geocode (Free, no API key required)
    try:
        url = f"https://api.bigdatacloud.net/data/reverse-geocode-client?latitude={lat}&longitude={lon}&localityLanguage=en"
        res = requests.get(url, timeout=1.8)
        if res.status_code == 200:
            d = res.json()
            city = d.get("city") or d.get("locality")
            subdivision = d.get("principalSubdivision") or "Maharashtra"
            if city:
                result = {
                    "location": city,
                    "district": city,
                    "state": subdivision,
                    "mandi": f"{city} APMC Yard",
                }
                _location_cache[cache_key] = result
                return result
    except Exception as e:
        logger.debug(f"Online reverse geocode skipped: {e}")

    # 2. Fast nearest-centroid district fallback
    best = None
    min_dist = float("inf")
    for d in MAHARASHTRA_DISTRICTS:
        dist = math.hypot(lat - d["lat"], lon - d["lon"])
        if dist < min_dist:
            min_dist = dist
            best = d

    if best:
        result = {
            "location": best["name"],
            "district": best["name"],
            "state": best["state"],
            "mandi": best["mandi"],
        }
    else:
        result = {
            "location": "Satara",
            "district": "Satara",
            "state": "Maharashtra",
            "mandi": "Satara APMC Yard",
        }

    _location_cache[cache_key] = result
    return result


def _normalize_lon(lon: float) -> float:
    """Wrap longitude into [-180, 180] range."""
    lon = lon % 360.0
    if lon > 180.0:
        lon -= 360.0
    return lon


def geojson_to_wkt(geojson: Dict) -> str:
    geom = shape(geojson)
    return geom.wkt


def wkt_to_geojson(wkt: str) -> Dict:
    from shapely import wkt as shapely_wkt

    geom = shapely_wkt.loads(wkt)
    return mapping(geom)


def polygon_centroid(geojson: Dict) -> Dict[str, float]:
    """Centroid of a farm polygon, used as the point location for weather APIs."""
    geom = shape(geojson)
    centroid = geom.centroid
    return {"lat": centroid.y, "lon": _normalize_lon(centroid.x)}


def polygon_area_acres(geojson: Dict) -> float:
    """Approximate area in acres using a local equirectangular projection."""
    geom = shape(geojson)
    coords = list(geom.exterior.coords)
    norm_coords = [(_normalize_lon(c[0]), c[1]) for c in coords]
    lat0 = sum(c[1] for c in norm_coords) / len(norm_coords)
    lat0_rad = math.radians(lat0)

    m_per_deg_lat = 111_132.92 - 559.82 * math.cos(2 * lat0_rad)
    m_per_deg_lon = 111_412.84 * math.cos(lat0_rad)

    def project(lon, lat, z=None):
        return (_normalize_lon(lon) * m_per_deg_lon, lat * m_per_deg_lat)

    projected = transform(project, geom)
    area_m2 = abs(projected.area)
    return round(area_m2 / 4046.8564224, 2)
