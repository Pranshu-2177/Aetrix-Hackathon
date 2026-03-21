"""HTTP endpoint for symptom analysis."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from backend.models.request import AnalyzeRequest
from backend.models.response import AnalyzeResponse
from backend.services.pipeline import run_pipeline

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_symptoms(request: AnalyzeRequest) -> AnalyzeResponse:
    """Run the text-based triage pipeline."""
    try:
        return await run_pipeline(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unhandled error while processing /analyze")
        raise HTTPException(status_code=500, detail="Internal server error") from exc
