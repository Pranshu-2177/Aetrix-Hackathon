"""
SwasthAI — Text-to-Speech Service
Converts text to audio using Google TTS (gTTS).
Returns a file path to the generated audio.
"""

import os
import uuid
from typing import Optional

# Audio output directory
AUDIO_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

# Language code mapping for gTTS
LANG_MAP = {
    "en": "en",
    "hi": "hi",
    "gu": "gu",
    "mr": "mr",
    "ta": "ta",
}


async def text_to_speech(text: str, language: str = "en") -> Optional[str]:
    """
    Convert text to speech audio file.
    Returns the file path (serve via static files in production).
    """
    try:
        from gtts import gTTS

        lang_code = LANG_MAP.get(language, "en")
        filename = f"response_{uuid.uuid4().hex[:8]}.mp3"
        filepath = os.path.join(AUDIO_DIR, filename)

        tts = gTTS(text=text, lang=lang_code, slow=False)
        tts.save(filepath)

        # Return relative URL path (frontend/WhatsApp bot will use this)
        return f"/static/audio/{filename}"

    except Exception as e:
        print(f"[TTS] Error generating audio: {e}")
        return None
