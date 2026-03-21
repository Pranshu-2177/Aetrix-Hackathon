"""
SwasthAI — /facilities/nearby Endpoint
Returns nearest PHCs and hospitals based on user's GPS coordinates and urgency tier.
"""

from __future__ import annotations

from fastapi import APIRouter, Query
from typing import List

from backend.models.response import FacilityInfo
from backend.services.hospitals_service import find_nearest_facilities

router = APIRouter()


@router.get("/facilities/nearby", response_model=List[FacilityInfo])
@router.get("/hospitals/nearby", response_model=List[FacilityInfo], include_in_schema=False)
async def get_nearby_facilities(
    lat: float = Query(..., description="User latitude"),
    lng: float = Query(..., description="User longitude"),
    triage: str = Query("clinic", description="self-care, clinic, or emergency"),
    limit: int = Query(5, description="Number of hospitals to return", ge=1, le=20)
):
    """
    Returns the nearest recommended facilities for the user's triage level.
    """
    return await find_nearest_facilities(lat, lng, triage_level=triage, limit=limit)
