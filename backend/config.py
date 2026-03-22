"""Runtime configuration for the SwasthAI backend."""

from __future__ import annotations

import os
from typing import List

from dotenv import load_dotenv

load_dotenv()


class Settings:
    APP_NAME: str = "SwasthAI API"
    APP_VERSION: str = "0.2.0"
    API_PREFIX: str = ""

    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    DEEPGRAM_API_KEY: str = os.getenv("DEEPGRAM_API_KEY", "")
    GOOGLE_TRANSLATE_API_KEY: str = os.getenv("GOOGLE_TRANSLATE_API_KEY", "")
    GOOGLE_MAPS_API_KEY: str = os.getenv("GOOGLE_MAPS_API_KEY", "")
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", os.getenv("NEXT_PUBLIC_SUPABASE_URL", ""))
    SUPABASE_KEY: str = os.getenv(
        "SUPABASE_KEY",
        os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("SUPABASE_ANON_KEY", "")),
    )
    OFFLINE_TRANSLATION_ENABLED: bool = os.getenv("OFFLINE_TRANSLATION_ENABLED", "true").lower() == "true"
    NLLB_MODEL_NAME: str = os.getenv("NLLB_MODEL_NAME", "facebook/nllb-200-distilled-600M")

    CORS_ORIGINS_RAW: str = os.getenv("CORS_ORIGINS", "*")

    @property
    def has_groq(self) -> bool:
        return bool(self.GROQ_API_KEY)

    @property
    def has_deepgram(self) -> bool:
        return bool(self.DEEPGRAM_API_KEY)

    @property
    def has_google_translate(self) -> bool:
        return bool(self.GOOGLE_TRANSLATE_API_KEY)

    @property
    def has_google_maps(self) -> bool:
        return bool(self.GOOGLE_MAPS_API_KEY)

    @property
    def has_supabase(self) -> bool:
        return bool(self.SUPABASE_URL and self.SUPABASE_KEY)

    @property
    def cors_origins(self) -> List[str]:
        if self.CORS_ORIGINS_RAW.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS_RAW.split(",") if origin.strip()]


settings = Settings()
