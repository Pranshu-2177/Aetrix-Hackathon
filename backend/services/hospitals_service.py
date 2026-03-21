"""
SwasthAI — Hospital Search Service
Finds nearest hospitals using Haversine distance calculation.
Starts with sample data; can be swapped to Supabase queries later.
"""

import math
from typing import List

# ============================================================
# Sample Hospital Data (Ahmedabad area)
# Replace with Supabase query once Member 5 populates the table
# ============================================================
SAMPLE_HOSPITALS = [
    {"name": "Civil Hospital Ahmedabad", "lat": 23.0225, "lng": 72.5714, "type": "Government", "contact": "079-22680721"},
    {"name": "VS General Hospital", "lat": 23.0396, "lng": 72.5856, "type": "Government", "contact": "079-22686301"},
    {"name": "Sterling Hospital", "lat": 23.0469, "lng": 72.5301, "type": "Private", "contact": "079-40011111"},
    {"name": "Zydus Hospital", "lat": 23.0568, "lng": 72.5340, "type": "Private", "contact": "079-66190200"},
    {"name": "Apollo Hospital", "lat": 23.0340, "lng": 72.5060, "type": "Private", "contact": "079-66701800"},
    {"name": "Sola Civil Hospital", "lat": 23.0693, "lng": 72.5144, "type": "Government", "contact": "079-27492303"},
    {"name": "HCG Cancer Centre", "lat": 23.0300, "lng": 72.5170, "type": "Specialty", "contact": "079-40020200"},
    {"name": "IKDRC Hospital", "lat": 23.0360, "lng": 72.5570, "type": "Government", "contact": "079-22682800"},
    {"name": "GCS Medical College Hospital", "lat": 23.0050, "lng": 72.5620, "type": "Teaching", "contact": "079-22162000"},
    {"name": "SAL Hospital", "lat": 23.0350, "lng": 72.5090, "type": "Private", "contact": "079-40703000"},
    {"name": "KD Hospital", "lat": 23.0450, "lng": 72.5450, "type": "Private", "contact": "079-66770000"},
    {"name": "UN Mehta Institute", "lat": 23.0370, "lng": 72.5580, "type": "Government", "contact": "079-22682092"},
    {"name": "SVP Hospital", "lat": 23.0280, "lng": 72.5800, "type": "Government", "contact": "079-25621424"},
    {"name": "Shardaben Hospital", "lat": 23.0130, "lng": 72.5510, "type": "Government", "contact": "079-22681239"},
    {"name": "LG Hospital", "lat": 23.0200, "lng": 72.5680, "type": "Government", "contact": "079-22685500"},
]


def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two GPS points in kilometers using Haversine formula."""
    R = 6371  # Earth's radius in km

    lat1_r, lat2_r = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)

    a = math.sin(dlat / 2) ** 2 + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlng / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


async def find_nearest_hospitals(lat: float, lng: float, limit: int = 5) -> List[dict]:
    """Find the nearest hospitals to the given coordinates."""
    results = []

    for hospital in SAMPLE_HOSPITALS:
        distance_km = _haversine(lat, lng, hospital["lat"], hospital["lng"])
        results.append({
            "name": hospital["name"],
            "lat": hospital["lat"],
            "lng": hospital["lng"],
            "type": hospital.get("type", "General"),
            "contact": hospital.get("contact"),
            "distance": f"{distance_km:.1f} km",
            "_distance_raw": distance_km,  # for sorting
        })

    # Sort by distance and return top N
    results.sort(key=lambda x: x["_distance_raw"])
    # Remove internal sort key
    for r in results:
        del r["_distance_raw"]

    return results[:limit]
