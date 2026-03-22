"""Google Places integration for live nearby hospital lookup."""

from __future__ import annotations

import math
from typing import Any, Optional

import httpx

from backend.config import settings

GOOGLE_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
GOOGLE_FIELD_MASK = ",".join([
    "places.displayName",
    "places.formattedAddress",
    "places.googleMapsUri",
    "places.location",
    "places.nationalPhoneNumber",
    "places.rating",
    "places.userRatingCount",
    "places.primaryType",
])


def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    radius_km = 6371
    lat1_r, lat2_r = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlng / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius_km * c


def _build_text_query(triage_level: Optional[str], symptom_text: Optional[str]) -> str:
    normalized = (symptom_text or "").lower()

    if triage_level == "emergency":
        if "chest" in normalized or "heart" in normalized:
            return "emergency heart hospital"
        if "breath" in normalized or "breathing" in normalized or "asthma" in normalized:
            return "emergency respiratory hospital"
        if "bleeding" in normalized or "accident" in normalized or "injury" in normalized or "burn" in normalized:
            return "emergency trauma hospital"
        return "emergency hospital"

    if "pregnan" in normalized or "baby" in normalized or "child" in normalized:
        return "hospital women child care"
    if "fever" in normalized or "vomit" in normalized or "infection" in normalized:
        return "general hospital"

    return "hospital"


def _match_reason(triage_level: Optional[str], rating: float, distance_km: float) -> str:
    rating_text = f"{rating:.1f} star rating"
    if triage_level == "emergency":
        return f"Chosen for urgent care, {distance_km:.1f} km away, with {rating_text}."
    return f"Chosen as a nearby care option, {distance_km:.1f} km away, with {rating_text}."


async def search_live_nearby_facilities(
    lat: float,
    lng: float,
    triage_level: Optional[str],
    symptom_text: Optional[str] = None,
    limit: int = 3,
) -> list[dict]:
    if not settings.has_google_maps:
        return []

    query = _build_text_query(triage_level, symptom_text)
    radius = 15000.0 if triage_level == "emergency" else 8000.0
    payload: dict[str, Any] = {
        "textQuery": query,
        "includedType": "hospital",
        "strictTypeFiltering": False,
        "languageCode": "en",
        "regionCode": "IN",
        "minRating": 3.0,
        "pageSize": 8,
        "rankPreference": "DISTANCE",
        "locationBias": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": radius,
            }
        },
    }

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": settings.GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": GOOGLE_FIELD_MASK,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.post(GOOGLE_TEXT_SEARCH_URL, json=payload, headers=headers)
            response.raise_for_status()
            body = response.json()
        except (httpx.HTTPError, ValueError):
            return []

    places = body.get("places", [])
    ranked_results: list[dict] = []

    for place in places:
        location = place.get("location") or {}
        place_lat = location.get("latitude")
        place_lng = location.get("longitude")
        if place_lat is None or place_lng is None:
            continue

        distance_km = _haversine(lat, lng, float(place_lat), float(place_lng))
        rating = float(place.get("rating") or 0.0)
        review_count = int(place.get("userRatingCount") or 0)
        score = (rating * 1.4) + min(review_count / 400, 1.5) - (distance_km * 0.08)

        ranked_results.append({
            "name": (place.get("displayName") or {}).get("text") or "Nearby hospital",
            "facility_type": "hospital",
            "lat": float(place_lat),
            "lng": float(place_lng),
            "distance_km": round(distance_km, 1),
            "distance_text": f"{distance_km:.1f} km",
            "rating": rating,
            "review_count": review_count,
            "match_reason": _match_reason(triage_level, rating, distance_km),
            "formatted_address": place.get("formattedAddress"),
            "maps_uri": place.get("googleMapsUri"),
            "contact": place.get("nationalPhoneNumber"),
            "recommended_for": [triage_level] if triage_level in {"clinic", "emergency"} else [],
            "_score": score,
        })

    unique_results: list[dict] = []
    seen_keys: set[str] = set()
    for item in sorted(ranked_results, key=lambda entry: (-entry["_score"], entry["distance_km"], -entry["rating"])):
        dedupe_key = f"{item['name']}|{item.get('formatted_address')}"
        if dedupe_key in seen_keys:
            continue
        seen_keys.add(dedupe_key)
        unique_results.append(item)
        if len(unique_results) >= limit:
            break

    for item in unique_results:
        item.pop("_score", None)

    return unique_results
