"""FastAPI application entrypoint for the backend MVP."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.routes.analyze import router as analyze_router

app = FastAPI(
    title=settings.APP_NAME,
    description="MVP backend for SwasthAI text-based health triage.",
    version=settings.APP_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router, prefix=settings.API_PREFIX, tags=["Triage"])


@app.get("/health", tags=["System"])
async def health_check() -> dict:
    """Lightweight health check for local development and deployment probes."""
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "groq_configured": settings.has_groq,
        "mode": "ai" if settings.has_groq else "rule-based-fallback",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
