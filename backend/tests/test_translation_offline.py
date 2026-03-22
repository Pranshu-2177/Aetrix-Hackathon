"""Manual verification for offline translation."""

import asyncio
from backend.services.translator import detect_language, translate_to_english, translate_from_english

async def main():
    print("--- SwasthAI Offline Translation Test ---")
    
    # Test 1: Detection
    texts = [
        "सीने में दर्द हो रहा है", # Hindi
        "છાતીમાં દુખાવો થાય છે", # Gujarati
        "I have a headache",       # English
    ]
    
    for t in texts:
        lang = await detect_language(t)
        print(f"Text: {t} -> Detected: {lang}")

    # Test 2: Translation to English
    for t in texts:
        eng = await translate_to_english(t)
        print(f"Original: {t} -> English: {eng}")

    # Test 3: Translation from English
    eng_resp = "Seek emergency care immediately for chest pain."
    for target in ["hi", "gu", "mr"]:
        localized = await translate_from_english(eng_resp, target)
        print(f"Target: {target} -> Localized: {localized}")

if __name__ == "__main__":
    asyncio.run(main())
