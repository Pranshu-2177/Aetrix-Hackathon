"""Find nearest PHCs and hospitals from a lightweight in-repo dataset."""

import math
from typing import List, Optional

SAMPLE_FACILITIES = [
    {"name": "Primary Health Centre, Sanand", "lat": 22.9950, "lng": 72.3810, "facility_type": "phc", "contact": "02717-222301", "recommended_for": ["clinic"]},
    {"name": "Primary Health Centre, Bareja", "lat": 22.8600, "lng": 72.5830, "facility_type": "phc", "contact": "02718-282040", "recommended_for": ["clinic"]},
    {"name": "Primary Health Centre, Dholka Rural", "lat": 22.7270, "lng": 72.4410, "facility_type": "phc", "contact": "02714-222410", "recommended_for": ["clinic"]},
    {"name": "Community Health Centre, Bavla", "lat": 22.8280, "lng": 72.3660, "facility_type": "chc", "contact": "02714-232055", "recommended_for": ["clinic", "emergency"]},
    {"name": "Community Health Centre, Dehgam", "lat": 23.1700, "lng": 72.8200, "facility_type": "chc", "contact": "02716-232801", "recommended_for": ["clinic", "emergency"]},
    {"name": "Referral Hospital, Dholka", "lat": 22.7278, "lng": 72.4425, "facility_type": "hospital", "contact": "02714-222051", "recommended_for": ["clinic", "emergency"]},
    {"name": "Civil Hospital Ahmedabad", "lat": 23.0510, "lng": 72.6030, "facility_type": "hospital", "contact": "079-22683721", "recommended_for": ["emergency"]},
    {"name": "Sola Civil Hospital", "lat": 23.0700, "lng": 72.5160, "facility_type": "hospital", "contact": "079-27492303", "recommended_for": ["emergency"]},
    {"name": "SVP Hospital", "lat": 23.0260, "lng": 72.5800, "facility_type": "hospital", "contact": "079-25621424", "recommended_for": ["emergency"]},
    {"name": "GMERS General Hospital, Gandhinagar", "lat": 23.2150, "lng": 72.6360, "facility_type": "hospital", "contact": "079-23275060", "recommended_for": ["emergency"]},
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


def _should_include(triage_level: Optional[str], facility: dict) -> bool:
    if not triage_level or triage_level == "self-care":
        return False
    return triage_level in facility["recommended_for"]


async def find_nearest_facilities(
    lat: float,
    lng: float,
    triage_level: Optional[str] = None,
    limit: int = 5,
) -> List[dict]:
    """Find the nearest appropriate PHCs or hospitals for the triage level."""
    results = []

    for facility in SAMPLE_FACILITIES:
        if not _should_include(triage_level, facility):
            continue

        distance_km = _haversine(lat, lng, facility["lat"], facility["lng"])
        results.append({
            "name": facility["name"],
            "facility_type": facility["facility_type"],
            "lat": facility["lat"],
            "lng": facility["lng"],
            "contact": facility.get("contact"),
            "recommended_for": facility["recommended_for"],
            "distance_km": round(distance_km, 1),
            "distance_text": f"{distance_km:.1f} km",
            "_distance_raw": distance_km,
        })

    results.sort(key=lambda x: x["_distance_raw"])
    for r in results:
        del r["_distance_raw"]

    return results[:limit]


async def find_nearest_hospitals(lat: float, lng: float, limit: int = 5) -> List[dict]:
    """Backward-compatible alias for facility lookup."""
    return await find_nearest_facilities(lat, lng, triage_level="emergency", limit=limit)
