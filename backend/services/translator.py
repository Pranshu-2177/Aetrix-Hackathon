"""
SwasthAI — Translation Service
Language detection and translation using googletrans.
Falls back to passthrough when the library is not available.
"""

from typing import Optional


async def detect_language(text: str) -> str:
    """Detect the language of the input text. Returns language code."""
    try:
        from googletrans import Translator
        translator = Translator()
        detected = translator.detect(text)
        return detected.lang if detected and detected.lang else "en"
    except Exception as e:
        print(f"[Translator] Detection error: {e}")
        return "en"


async def translate_to_english(text: str, source_lang: Optional[str] = None) -> str:
    """Translate text to English for AI processing."""
    if source_lang == "en":
        return text

    try:
        from googletrans import Translator
        translator = Translator()
        result = translator.translate(text, dest="en", src=source_lang or "auto")
        return result.text
    except Exception as e:
        print(f"[Translator] To-English error: {e}")
        return text  # Return original if translation fails


async def translate_from_english(text: str, target_lang: str) -> str:
    """Translate English AI response back to user's language."""
    if target_lang == "en":
        return text

    try:
        from googletrans import Translator
        translator = Translator()
        result = translator.translate(text, dest=target_lang, src="en")
        return result.text
    except Exception as e:
        print(f"[Translator] From-English error: {e}")
        return text  # Return English if translation fails
