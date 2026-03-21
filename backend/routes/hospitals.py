"""
SwasthAI — /hospitals/nearby Endpoint
Returns nearest hospitals based on user's GPS coordinates.
"""

from fastapi import APIRouter, Query
from typing import List
from models.response import HospitalInfo
from services.hospitals_service import find_nearest_hospitals

router = APIRouter()


@router.get("/hospitals/nearby", response_model=List[HospitalInfo])
async def get_nearby_hospitals(
    lat: float = Query(..., description="User latitude"),
    lng: float = Query(..., description="User longitude"),
    limit: int = Query(5, description="Number of hospitals to return", ge=1, le=20)
):
    """
    Returns the nearest hospitals based on the user's GPS location.
    Uses Haversine formula for distance calculation.
    """
    hospitals = await find_nearest_hospitals(lat, lng, limit)
    return hospitals
