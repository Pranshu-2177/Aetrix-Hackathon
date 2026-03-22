"""FastAPI application entrypoint for the backend MVP."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.routes.analyze import router as analyze_router
from backend.routes.hospitals import router as facilities_router
from backend.routes.whatsapp import router as whatsapp_router

app = FastAPI(
    title=settings.APP_NAME,
    description="Rural-first SwasthAI backend for multilingual rule-based health triage.",
    version=settings.APP_VERSION,
)

@app.on_event("startup")
async def startup_event():
    """Pre-load the offline translator model at startup."""
    from backend.services.translator import OfflineTranslator
    # Run in a separate thread if possible, or just call it here
    # Since it's a singleton, it won't block future calls
    translator = OfflineTranslator.get_instance()
    translator.initialize()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router, prefix=settings.API_PREFIX, tags=["Triage"])
app.include_router(facilities_router, prefix=settings.API_PREFIX, tags=["Facilities"])
app.include_router(whatsapp_router, prefix=settings.API_PREFIX, tags=["WhatsApp"])


@app.get("/health", tags=["System"])
async def health_check() -> dict:
    """Lightweight health check for local development and deployment probes."""
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "mode": "groq-first-with-fallback" if settings.has_groq else "fallback-only",
        "groq_configured": settings.has_groq,
        "groq_model": settings.GROQ_MODEL if settings.has_groq else None,
        "deepgram_configured": settings.has_deepgram,
        "google_translate_configured": settings.has_google_translate,
        "google_maps_configured": settings.has_google_maps,
        "supabase_configured": settings.has_supabase,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
