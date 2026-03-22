"""Offline-first translation using Meta's NLLB-200 model."""

from __future__ import annotations

import html
import re
import threading
from typing import Dict, List, Optional

import httpx

from backend.config import settings

# --- Supported Regional Languages ---
SUPPORTED_LANGUAGES = {"en", "hi", "gu", "mr", "ta"}
GOOGLE_TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2"

# Map for NLLB language codes
NLLB_LANG_MAP = {
    "hi": "hin_Deva",
    "gu": "guj_Gujr",
    "mr": "mar_Deva",
    "ta": "tam_Taml",
    "en": "eng_Latn",
}

# --- Offline Model Loader (Singleton) ---
class OfflineTranslator:
    _instance = None
    _lock = threading.Lock()

    def __init__(self):
        self.tokenizer = None
        self.model = None
        self.initialized = False

    @classmethod
    def get_instance(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = cls()
            return cls._instance

    def initialize(self):
        if self.initialized:
            return
        
        if not settings.OFFLINE_TRANSLATION_ENABLED:
            return

        try:
            print(f"[Translator] Loading offline model: {settings.NLLB_MODEL_NAME}...")
            from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
            import torch

            # Use CPU by default for stability in small servers, or GPU if available and requested
            device = "cuda" if torch.cuda.is_available() else "cpu"
            
            self.tokenizer = AutoTokenizer.from_pretrained(settings.NLLB_MODEL_NAME)
            self.model = AutoModelForSeq2SeqLM.from_pretrained(settings.NLLB_MODEL_NAME).to(device)
            self.initialized = True
            print("[Translator] Offline model loaded successfully.")
        except ImportError:
            print("[Translator] Transformers/Torch not installed. Offline translation disabled.")
        except Exception as e:
            print(f"[Translator] Failed to load offline model: {e}")

    def translate(self, text: str, src_lang: str, target_lang: str = "en") -> Optional[str]:
        if not self.initialized:
            self.initialize()
        
        if not self.initialized or not self.model or not self.tokenizer:
            return None

        try:
            import torch
            src_code = NLLB_LANG_MAP.get(src_lang)
            tgt_code = NLLB_LANG_MAP.get(target_lang)
            
            if not src_code or not tgt_code:
                return None

            self.tokenizer.src_lang = src_code
            inputs = self.tokenizer(text, return_tensors="pt").to(self.model.device)
            
            translated_tokens = self.model.generate(
                **inputs,
                forced_bos_token_id=self.tokenizer.convert_tokens_to_ids(tgt_code),
                max_length=200
            )
            
            return self.tokenizer.decode(translated_tokens[0], skip_special_tokens=True)
        except Exception as e:
            print(f"[Translator] NLLB translation error: {e}")
            return None

# --- Static Term Maps (Fast Fallbacks) ---
TERM_MAP: Dict[str, Dict[str, str]] = {
    "hi": {
        "सीने में दर्द": "chest pain",
        "सांस लेने में तकलीफ": "difficulty breathing",
        "बुखार": "fever",
        "mujhe bukhar aa raha hai": "I have fever",
        "bukhar": "fever",
        "sir dard": "headache",
        "khasi": "cough",
    },
    "gu": {
        "છાતીમાં દુખાવો": "chest pain",
        "શ્વાસ લેવામાં તકલીફ": "difficulty breathing",
        "તાવ": "fever",
        "tav": "fever",
        "mane tav aave chhe": "I have fever",
        "mathu dukhe": "headache",
        "khasi": "cough",
    },
    "mr": {
        "छातीत दुखत": "chest pain",
        "श्वास घेण्यास त्रास": "difficulty breathing",
        "ताप": "fever",
        "mala tap aala ahe": "I have fever",
        "tap": "fever",
        "doke dukhte": "headache",
    }
}

STATIC_TRANSLATIONS: Dict[str, Dict[str, str]] = {
    "hi": {
        "Unknown symptoms": "अज्ञात लक्षण",
        "Mild fever reported": "हल्का बुखार दर्ज किया गया",
        "Can you please describe what's happening to you?": "क्या आप बता सकते हैं कि आपको क्या समस्या हो रही है?",
        "What symptoms are you experiencing?": "आप कौन से लक्षण महसूस कर रहे हैं?",
        "What symptoms are you having right now?": "आपको अभी क्या समस्याएं हो रही हैं?",
        "How long have you had them?": "आपको ये समस्याएं कब से हैं?",
        "Please tell me your symptoms so I can guide you safely.": "कृपया मुझे अपने लक्षण बताएं ताकि मैं सही सलाह दे सकूं।",
    },
    "gu": {
        "Unknown symptoms": "અજ્ઞાત લક્ષણો",
        "Mild fever reported": "સામાન્ય તાવ નોંધાયો છે",
        "Can you please describe what's happening to you?": "શું તમે કૃપા કરીને જણાવી શકશો કે તમને શું થઈ રહ્યું છે?",
        "What symptoms are you experiencing?": "તમે કયા લક્ષણોનો અનુભવ કરી રહ્યા છો?",
        "What symptoms are you having right now?": "તમને અત્યારે કયા લક્ષણો છે?",
        "How long have you had them?": "આ લક્ષણો તમને ક્યારથી છે?",
        "Please tell me your symptoms so I can guide you safely.": "કૃપા કરીને મને તમારા લક્ષણો જણાવો જેથી હું તમને યોગ્ય સલાહ આપી શકું.",
    },
    "mr": {
        "Unknown symptoms": "अज्ञात लक्षणे",
        "Mild fever reported": "सौम्य ताप नोंदवला गेला",
        "Can you please describe what's happening to you?": "कृपया तुम्हाला काय त्रास होत आहे ते सांगू शकता का?",
        "What symptoms are you experiencing?": "तुम्हाला कोणती लक्षणे जाणवत आहेत?",
        "What symptoms are you having right now?": "तुम्हाला सध्या काय त्रास होत आहे?",
        "How long have you had them?": "हा त्रास तुम्हाला किती दिवसांपासून आहे?",
        "Please tell me your symptoms so I can guide you safely.": "कृपया तुमची लक्षणे सांगा जेणेकरून मी तुम्हाला योग्य मार्गदर्शन करू शकेन.",
    }
}

# --- Service Functions ---

async def detect_language(text: str) -> str:
    """Detect language using langdetect with script range fallback."""
    if not text.strip():
        return "en"

    # 1. Script range check (extremely fast)
    if re.search(r"[\u0A80-\u0AFF]", text): return "gu"
    if re.search(r"[\u0B80-\u0BFF]", text): return "ta"
    if re.search(r"[\u0900-\u097F]", text):
        # Could be Hindi or Marathi. Use langdetect to disambiguate.
        pass

    # 2. Industry standard detection
    try:
        from langdetect import detect
        detected = detect(text)
        if detected in SUPPORTED_LANGUAGES:
            return detected
    except:
        pass

    return "en"

async def translate_to_english(text: str, source_lang: Optional[str] = None) -> str:
    """Translate text to English using Dictionary -> Google API -> NLLB Offline."""
    if not text.strip():
        return text

    source_lang = source_lang or await detect_language(text)
    if source_lang == "en":
        return text

    # Phase 1: Dictionary (Instant)
    normalized = text.lower()
    replacements = TERM_MAP.get(source_lang, {})
    for source, target in replacements.items():
        if source in normalized:
            return target # Quick return for single symptoms

    # Phase 2: Google Translate (If available)
    if settings.has_google_translate:
        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(
                    GOOGLE_TRANSLATE_URL,
                    params={"q": text, "target": "en", "source": source_lang, "key": settings.GOOGLE_TRANSLATE_API_KEY}
                )
                if res.status_code == 200:
                    return html.unescape(res.json()["data"]["translations"][0]["translatedText"])
        except:
            pass

    # Phase 3: NLLB Offline
    offline = OfflineTranslator.get_instance()
    result = offline.translate(text, src_lang=source_lang, target_lang="en")
    if result:
        return result

    return text

async def translate_from_english(text: str, target_lang: str) -> str:
    """Translate response back to user's language."""
    if target_lang == "en" or not text.strip():
        return text

    # Phase 1: Google Translate
    if settings.has_google_translate:
        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(
                    GOOGLE_TRANSLATE_URL,
                    params={"q": text, "target": target_lang, "source": "en", "key": settings.GOOGLE_TRANSLATE_API_KEY}
                )
                if res.status_code == 200:
                    return html.unescape(res.json()["data"]["translations"][0]["translatedText"])
        except:
            pass

    # Phase 2: NLLB Offline
    offline = OfflineTranslator.get_instance()
    result = offline.translate(text, src_lang="en", target_lang=target_lang)
    if result:
        return result

    # Phase 3: Static Dictionary Fallback
    static_dict = STATIC_TRANSLATIONS.get(target_lang, {})
    if text in static_dict:
        return static_dict[text]
    
    return text

async def translate_text_list(texts: List[str], target_lang: str) -> List[str]:
    """Translate a list of strings."""
    return [await translate_from_english(t, target_lang) for t in texts]
