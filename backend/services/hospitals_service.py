"""Find nearest PHCs and hospitals from a lightweight in-repo dataset."""

import math
from typing import List, Optional

from backend.services.database import get_facilities
from backend.services.google_places_service import search_live_nearby_facilities

SAMPLE_FACILITIES = [
    {
        "name": "Primary Health Centre, Sanand",
        "lat": 22.9950,
        "lng": 72.3810,
        "facility_type": "phc",
        "contact": "02717-222301",
        "recommended_for": ["clinic"],
        "rating": 4.2,
        "review_count": 148,
        "specialties": ["general", "fever", "infection", "women_child"],
    },
    {
        "name": "Primary Health Centre, Bareja",
        "lat": 22.8600,
        "lng": 72.5830,
        "facility_type": "phc",
        "contact": "02718-282040",
        "recommended_for": ["clinic"],
        "rating": 4.1,
        "review_count": 126,
        "specialties": ["general", "fever", "infection", "women_child"],
    },
    {
        "name": "Primary Health Centre, Dholka Rural",
        "lat": 22.7270,
        "lng": 72.4410,
        "facility_type": "phc",
        "contact": "02714-222410",
        "recommended_for": ["clinic"],
        "rating": 4.0,
        "review_count": 94,
        "specialties": ["general", "fever", "infection"],
    },
    {
        "name": "Community Health Centre, Bavla",
        "lat": 22.8280,
        "lng": 72.3660,
        "facility_type": "chc",
        "contact": "02714-232055",
        "recommended_for": ["clinic", "emergency"],
        "rating": 4.4,
        "review_count": 208,
        "specialties": ["general", "trauma", "respiratory", "women_child"],
    },
    {
        "name": "Community Health Centre, Dehgam",
        "lat": 23.1700,
        "lng": 72.8200,
        "facility_type": "chc",
        "contact": "02716-232801",
        "recommended_for": ["clinic", "emergency"],
        "rating": 4.3,
        "review_count": 186,
        "specialties": ["general", "trauma", "fever", "respiratory"],
    },
    {
        "name": "Referral Hospital, Dholka",
        "lat": 22.7278,
        "lng": 72.4425,
        "facility_type": "hospital",
        "contact": "02714-222051",
        "recommended_for": ["clinic", "emergency"],
        "rating": 4.5,
        "review_count": 264,
        "specialties": ["general", "trauma", "respiratory", "cardiac"],
    },
    {
        "name": "Civil Hospital Ahmedabad",
        "lat": 23.0510,
        "lng": 72.6030,
        "facility_type": "hospital",
        "contact": "079-22683721",
        "recommended_for": ["emergency"],
        "rating": 4.7,
        "review_count": 1260,
        "specialties": ["trauma", "respiratory", "cardiac", "women_child", "infection"],
    },
    {
        "name": "Sola Civil Hospital",
        "lat": 23.0700,
        "lng": 72.5160,
        "facility_type": "hospital",
        "contact": "079-27492303",
        "recommended_for": ["emergency"],
        "rating": 4.6,
        "review_count": 884,
        "specialties": ["trauma", "respiratory", "cardiac", "infection"],
    },
    {
        "name": "SVP Hospital",
        "lat": 23.0260,
        "lng": 72.5800,
        "facility_type": "hospital",
        "contact": "079-25621424",
        "recommended_for": ["emergency"],
        "rating": 4.8,
        "review_count": 1432,
        "specialties": ["trauma", "respiratory", "cardiac", "infection", "women_child"],
    },
    {
        "name": "GMERS General Hospital, Gandhinagar",
        "lat": 23.2150,
        "lng": 72.6360,
        "facility_type": "hospital",
        "contact": "079-23275060",
        "recommended_for": ["emergency"],
        "rating": 4.5,
        "review_count": 632,
        "specialties": ["trauma", "respiratory", "cardiac", "infection"],
    },
]

SYMPTOM_TAGS = {
    "respiratory": {"breathing", "breath", "asthma", "cough", "lungs", "oxygen", "respiratory", "sneeze"},
    "cardiac": {"chest pain", "chest", "heart", "palpitation", "pressure"},
    "trauma": {"wound", "bleeding", "fracture", "burn", "injury", "accident", "cut", "swelling"},
    "women_child": {"pregnant", "pregnancy", "baby", "child", "delivery", "period", "breastfeeding"},
    "fever": {"fever", "vomiting", "weakness", "infection", "cold", "body pain", "diarrhea"},
}

TYPE_WEIGHT = {
    "clinic": {"phc": 1.0, "chc": 0.92, "hospital": 0.82},
    "emergency": {"hospital": 1.0, "chc": 0.9, "phc": 0.45},
}


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


def _detect_symptom_tags(symptom_text: Optional[str]) -> set[str]:
    if not symptom_text:
        return set()

    normalized = symptom_text.lower()
    tags: set[str] = {"general"}

    for tag, keywords in SYMPTOM_TAGS.items():
        if any(keyword in normalized for keyword in keywords):
            tags.add(tag)

    return tags


def _build_match_reason(triage_level: str, facility: dict, symptom_tags: set[str]) -> str:
    matched_tags = [tag for tag in facility.get("specialties", []) if tag in symptom_tags and tag != "general"]

    if "cardiac" in matched_tags:
        return "Good option for chest pain or heart-related symptoms."
    if "respiratory" in matched_tags:
        return "Good option for breathing or severe cough symptoms."
    if "trauma" in matched_tags:
        return "Good option for injury, wound, burn, or bleeding support."
    if "women_child" in matched_tags:
        return "Good option for pregnancy, women, or child health concerns."
    if "fever" in matched_tags:
        return "Good option for fever, vomiting, or infection-related symptoms."
    if triage_level == "emergency":
        return "Recommended because it can handle urgent or emergency care."
    return "Recommended because it is a nearby option for clinic-level care."


def _format_maps_uri(facility: dict) -> str:
    if facility.get("maps_uri"):
        return str(facility["maps_uri"])
    if facility.get("address"):
        return f"https://www.google.com/maps/search/?api=1&query={facility['address'].replace(' ', '+')}"
    return f"https://www.google.com/maps/search/?api=1&query={facility['lat']},{facility['lng']}"


def _score_facility(
    facility: dict,
    lat: float,
    lng: float,
    triage_level: str,
    symptom_tags: set[str],
) -> dict:
    distance_km = _haversine(lat, lng, float(facility["lat"]), float(facility["lng"]))
    type_weight = TYPE_WEIGHT.get(triage_level or "", {}).get(facility["facility_type"], 0.5)
    specialty_hits = len(set(facility.get("specialties") or []) & symptom_tags)
    rating = float(facility.get("rating") or 4.0)
    review_count = int(facility.get("review_count") or 0)
    score = (type_weight * 3.2) + (specialty_hits * 0.22) + (rating * 0.35) - (distance_km * 0.08)

    return {
        "name": facility["name"],
        "facility_type": facility["facility_type"],
        "lat": float(facility["lat"]),
        "lng": float(facility["lng"]),
        "contact": facility.get("contact"),
        "recommended_for": facility.get("recommended_for") or [],
        "rating": rating,
        "review_count": review_count,
        "match_reason": _build_match_reason(triage_level or "clinic", facility, symptom_tags),
        "formatted_address": facility.get("address"),
        "maps_uri": _format_maps_uri(facility),
        "distance_km": round(distance_km, 1),
        "distance_text": f"{distance_km:.1f} km",
        "_distance_raw": distance_km,
        "_score": score,
    }


async def find_nearest_facilities(
    lat: float,
    lng: float,
    triage_level: Optional[str] = None,
    limit: int = 3,
    symptom_text: Optional[str] = None,
) -> List[dict]:
    """Find the nearest appropriate PHCs or hospitals for the triage level."""
    symptom_tags = _detect_symptom_tags(symptom_text)

    facilities_from_supabase = await get_facilities(triage_level)
    if facilities_from_supabase:
        results = [
            _score_facility(facility, lat, lng, triage_level or "clinic", symptom_tags)
            for facility in facilities_from_supabase
        ]
        results.sort(key=lambda x: (-x["_score"], x["_distance_raw"], -x["rating"]))
        for r in results:
            del r["_distance_raw"]
            del r["_score"]
        return results[:limit]

    live_results = await search_live_nearby_facilities(
        lat=lat,
        lng=lng,
        triage_level=triage_level,
        symptom_text=symptom_text,
        limit=limit,
    )
    if live_results:
        return live_results

    results = []

    for facility in SAMPLE_FACILITIES:
        if not _should_include(triage_level, facility):
            continue

        results.append(_score_facility(facility, lat, lng, triage_level or "clinic", symptom_tags))

    results.sort(key=lambda x: (-x["_score"], x["_distance_raw"], -x["rating"]))
    for r in results:
        del r["_distance_raw"]
        del r["_score"]

    return results[:limit]


async def find_nearest_hospitals(lat: float, lng: float, limit: int = 5) -> List[dict]:
    """Backward-compatible alias for facility lookup."""
    return await find_nearest_facilities(lat, lng, triage_level="emergency", limit=limit)
