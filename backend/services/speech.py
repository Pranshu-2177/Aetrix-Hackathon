"""
SwasthAI — Speech-to-Text Service
Converts audio to text using Deepgram API.
Returns the transcript as a string.
"""

from typing import Optional
from config import settings


async def speech_to_text(audio_bytes: bytes) -> Optional[str]:
    """
    Convert audio bytes to text transcript using Deepgram.
    Returns None if transcription fails or Deepgram is not configured.
    """
    if not settings.has_deepgram:
        print("[Speech] Deepgram not configured, skipping transcription")
        return None

    try:
        from deepgram import DeepgramClient, PrerecordedOptions

        client = DeepgramClient(settings.DEEPGRAM_API_KEY)

        options = PrerecordedOptions(
            model="nova-2",
            language="hi",  # Default to Hindi, auto-detects other languages
            smart_format=True,
            detect_language=True,
        )

        response = client.listen.prerecorded.v("1").transcribe_file(
            {"buffer": audio_bytes, "mimetype": "audio/wav"},
            options,
        )

        transcript = response.results.channels[0].alternatives[0].transcript
        return transcript if transcript else None

    except Exception as e:
        print(f"[Speech] Deepgram error: {e}")
        return None
