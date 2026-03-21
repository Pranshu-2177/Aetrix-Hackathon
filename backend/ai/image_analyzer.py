"""
SwasthAI — Image Analyzer
Sends user-uploaded medical images to Groq vision model for description.
Falls back to a generic description when Groq is not configured.
"""

from typing import Optional
from config import settings


async def analyze_image(base64_image: str) -> Optional[str]:
    """
    Analyze a medical image and return a text description.
    Used as additional context for the triage engine.
    """
    if not base64_image:
        return None

    if settings.has_groq:
        return await _analyze_with_groq(base64_image)
    return _analyze_fallback()


async def _analyze_with_groq(base64_image: str) -> Optional[str]:
    """Use Groq vision model for image analysis."""
    try:
        from groq import Groq
        from ai.prompts import IMAGE_ANALYSIS_PROMPT

        client = Groq(api_key=settings.GROQ_API_KEY)

        # Ensure proper data URI format
        if not base64_image.startswith("data:"):
            base64_image = f"data:image/jpeg;base64,{base64_image}"

        response = client.chat.completions.create(
            model="llama-3.2-90b-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": IMAGE_ANALYSIS_PROMPT},
                        {"type": "image_url", "image_url": {"url": base64_image}},
                    ],
                }
            ],
            temperature=0.2,
            max_tokens=200,
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        print(f"[ImageAnalyzer] Groq vision error: {e}")
        return _analyze_fallback()


def _analyze_fallback() -> str:
    """Fallback when Groq vision is not available."""
    return "An image was uploaded by the user showing a potential medical condition. Please consider this in your assessment."
