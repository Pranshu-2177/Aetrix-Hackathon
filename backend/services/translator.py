"""Google-backed translation helpers with local fallbacks for rural MVP use."""

from __future__ import annotations

import html
import re
from typing import Dict, List, Optional

import httpx

from backend.config import settings

SUPPORTED_LANGUAGES = {"en", "hi", "gu", "mr", "ta"}
GOOGLE_TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2"

TERM_MAP: Dict[str, Dict[str, str]] = {
    "hi": {
        "सीने में दर्द": "chest pain",
        "सांस लेने में तकलीफ": "difficulty breathing",
        "सांस नहीं ले पा रहा": "cannot breathe",
        "खून बंद नहीं हो रहा": "blood won't stop",
        "खून बह रहा है": "heavy bleeding",
        "बेहोश": "unconscious",
        "दौरा": "seizure",
        "सिरदर्द": "headache",
        "बुखार": "fever",
        "ताप": "fever",
        "खांसी": "cough",
        "उल्टी": "vomiting",
        "दस्त": "diarrhea",
        "सूजन": "swelling",
        "घाव": "wound",
        "संक्रमण": "infection",
        "दर्द": "pain",
    },
    "gu": {
        "છાતીમાં દુખાવો": "chest pain",
        "શ્વાસ લેવામાં તકલીફ": "difficulty breathing",
        "શ્વાસ નથી લેવાતો": "cannot breathe",
        "લોહી બંધ થતું નથી": "blood won't stop",
        "ખૂબ લોહી વહે છે": "heavy bleeding",
        "બેહોશ": "unconscious",
        "ઝટકો": "seizure",
        "માથાનો દુખાવો": "headache",
        "તાવ": "fever",
        "ઉધરસ": "cough",
        "ઉલટી": "vomiting",
        "ઝાડા": "diarrhea",
        "સોજો": "swelling",
        "જખમ": "wound",
        "ચેપ": "infection",
        "દુખાવો": "pain",
    },
    "mr": {
        "छातीत दुखत": "chest pain",
        "श्वास घेण्यास त्रास": "difficulty breathing",
        "श्वास घ्यायला त्रास": "difficulty breathing",
        "रक्त थांबत नाही": "blood won't stop",
        "रक्तस्त्राव": "heavy bleeding",
        "बेशुद्ध": "unconscious",
        "झटका": "seizure",
        "डोकेदुखी": "headache",
        "ताप": "fever",
        "खोकला": "cough",
        "उलटी": "vomiting",
        "जुलाब": "diarrhea",
        "सूज": "swelling",
        "जखम": "wound",
        "संसर्ग": "infection",
        "वेदना": "pain",
        "दुखणे": "pain",
    },
    "ta": {
        "மார்பு வலி": "chest pain",
        "மூச்சுத்திணறல்": "difficulty breathing",
        "சுவாசிக்க முடியவில்லை": "cannot breathe",
        "இரத்தம் நின்றுவிடவில்லை": "blood won't stop",
        "அதிக இரத்தப்போக்கு": "heavy bleeding",
        "மயங்கி விழுந்தார்": "unconscious",
        "மயக்கம்": "unconscious",
        "வலிப்பு": "seizure",
        "தலைவலி": "headache",
        "காய்ச்சல்": "fever",
        "இருமல்": "cough",
        "வாந்தி": "vomiting",
        "வயிற்றுப்போக்கு": "diarrhea",
        "வீக்கம்": "swelling",
        "காயம்": "wound",
        "தொற்று": "infection",
        "வலி": "pain",
    },
}

STATIC_TRANSLATIONS: Dict[str, Dict[str, str]] = {
    "hi": {
        "Possible cardiac emergency. Call 108 or go to the nearest emergency department now.": "दिल या छाती से जुड़ी आपात स्थिति हो सकती है। अभी 108 पर कॉल करें या नजदीकी अस्पताल जाएं।",
        "Breathing difficulty can become life-threatening. Get emergency help immediately.": "सांस लेने में तकलीफ खतरनाक हो सकती है। तुरंत आपात सहायता लें।",
        "Heavy bleeding needs urgent emergency care. Apply direct pressure and call 108.": "अधिक खून बह रहा है। दबाव डालें और तुरंत 108 पर कॉल करें।",
        "Loss of consciousness or seizures require emergency evaluation immediately.": "बेहोशी या दौरे की स्थिति में तुरंत आपात जांच जरूरी है।",
        "Possible stroke. Emergency treatment is time-critical, so seek immediate care.": "स्ट्रोक हो सकता है। तुरंत इलाज के लिए अभी अस्पताल जाएं।",
        "Your symptoms include emergency warning signs that need immediate medical attention.": "आपके लक्षण आपात स्थिति के संकेत दे रहे हैं और तुरंत इलाज की जरूरत है।",
        "Persistent fever, cough, diarrhea, vomiting, or worsening symptoms should be checked at a clinic soon.": "लगातार बुखार, खांसी, दस्त, उल्टी या बढ़ते लक्षणों के लिए जल्दी क्लिनिक या PHC जाएं।",
        "Severe pain, swelling, or signs of infection should be assessed by a clinician.": "तेज दर्द, सूजन या संक्रमण के लक्षणों की डॉक्टर से जांच करानी चाहिए।",
        "Mild symptoms can be monitored at home for now if there are no danger signs.": "यदि खतरे के संकेत नहीं हैं तो हल्के लक्षणों को अभी घर पर देखा जा सकता है।",
        "Call 108 or go to the nearest emergency department now.": "अभी 108 पर कॉल करें या नजदीकी आपात अस्पताल जाएं।",
        "Do not rely on home remedies for these symptoms.": "इन लक्षणों के लिए सिर्फ घरेलू उपचार पर भरोसा न करें।",
        "If possible, have someone stay with you while you seek help.": "संभव हो तो मदद के लिए किसी को अपने साथ रखें।",
        "Visit the nearest PHC or clinic within the next 24 to 48 hours.": "अगले 24 से 48 घंटों में नजदीकी PHC या क्लिनिक जाएं।",
        "Monitor whether the symptoms are lasting longer, getting worse, or spreading.": "देखें कि लक्षण कितनी देर से हैं, बढ़ रहे हैं या फैल रहे हैं।",
        "Go sooner if you develop chest pain, breathing trouble, confusion, or fainting.": "यदि छाती में दर्द, सांस की तकलीफ, भ्रम या बेहोशी हो तो और जल्दी जाएं।",
        "Rest, drink safe fluids, and monitor symptoms for the next 24 hours.": "आराम करें, साफ तरल पिएं और अगले 24 घंटे लक्षण देखें।",
        "Use basic home care only if symptoms stay mild and there are no danger signs.": "लक्षण हल्के रहें और कोई खतरे का संकेत न हो तभी सामान्य घरेलू देखभाल करें।",
        "Visit the nearest PHC if symptoms continue beyond 2 days or worsen.": "यदि लक्षण 2 दिन से ज्यादा रहें या बढ़ें तो नजदीकी PHC जाएं।",
        "This gives quick guidance only. It is not a doctor's final advice. If you feel worse or feel unsafe, go to a doctor or hospital.": "यह केवल जल्दी मदद के लिए है। यह डॉक्टर की अंतिम सलाह नहीं है। हालत बिगड़े या चिंता हो तो डॉक्टर या अस्पताल जाएं।",
    },
    "gu": {
        "Possible cardiac emergency. Call 108 or go to the nearest emergency department now.": "હૃદય અથવા છાતીની તાત્કાલિક સમસ્યા હોઈ શકે છે. હમણાં 108 પર કૉલ કરો અથવા નજીકની હોસ્પિટલમાં જાઓ.",
        "Breathing difficulty can become life-threatening. Get emergency help immediately.": "શ્વાસ લેવામાં તકલીફ ખતરનાક બની શકે છે. તરત જ આપાતકાલીન મદદ લો.",
        "Heavy bleeding needs urgent emergency care. Apply direct pressure and call 108.": "ઘણું લોહી વહે છે. સીધો દબાણ કરો અને તરત 108 પર કૉલ કરો.",
        "Loss of consciousness or seizures require emergency evaluation immediately.": "બેહોશી અથવા ઝટકાની સ્થિતિમાં તરત જ આપાત સારવાર જરૂરી છે.",
        "Possible stroke. Emergency treatment is time-critical, so seek immediate care.": "સ્ટ્રોક હોઈ શકે છે. સમયસર સારવાર જરૂરી છે, તેથી તરત હોસ્પિટલ જાઓ.",
        "Your symptoms include emergency warning signs that need immediate medical attention.": "તમારા લક્ષણોમાં આપાતકાલીન ચેતવણીના સંકેતો છે અને તરત સારવાર જોઈએ.",
        "Persistent fever, cough, diarrhea, vomiting, or worsening symptoms should be checked at a clinic soon.": "લાગાતાર તાવ, ઉધરસ, ઝાડા, ઉલટી અથવા વધતા લક્ષણો માટે જલ્દી ક્લિનિક અથવા PHC જાઓ.",
        "Severe pain, swelling, or signs of infection should be assessed by a clinician.": "જોરદાર દુખાવો, સોજો અથવા ચેપના લક્ષણો ડૉક્ટરે તપાસવા જોઈએ.",
        "Mild symptoms can be monitored at home for now if there are no danger signs.": "જો જોખમના સંકેતો ન હોય તો હળવા લક્ષણો હાલ ઘરે દેખરેખમાં રાખી શકાય.",
        "Call 108 or go to the nearest emergency department now.": "હમણાં 108 પર કૉલ કરો અથવા નજીકની આપાત હોસ્પિટલમાં જાઓ.",
        "Do not rely on home remedies for these symptoms.": "આ લક્ષણોમાં ફક્ત ઘરેલું ઉપચાર પર ભરોસો ન રાખો.",
        "If possible, have someone stay with you while you seek help.": "શક્ય હોય તો મદદ મેળવતા સુધી કોઈને તમારા સાથે રાખો.",
        "Visit the nearest PHC or clinic within the next 24 to 48 hours.": "આગામી 24 થી 48 કલાકમાં નજીકના PHC અથવા ક્લિનિકમાં જાઓ.",
        "Monitor whether the symptoms are lasting longer, getting worse, or spreading.": "લક્ષણો લાંબા સમયથી છે, વધે છે કે ફેલાય છે કે નહીં તે જુઓ.",
        "Go sooner if you develop chest pain, breathing trouble, confusion, or fainting.": "છાતીમાં દુખાવો, શ્વાસમાં તકલીફ, ગૂંચવણ અથવા બેહોશી થાય તો વધુ વહેલા જાઓ.",
        "Rest, drink safe fluids, and monitor symptoms for the next 24 hours.": "આરામ કરો, સુરક્ષિત પ્રવાહી પીવો અને આવતા 24 કલાક લક્ષણો જુઓ.",
        "Use basic home care only if symptoms stay mild and there are no danger signs.": "લક્ષણો હળવા રહે અને જોખમના સંકેતો ન હોય ત્યારે જ સામાન્ય ઘરેલું કાળજી લો.",
        "Visit the nearest PHC if symptoms continue beyond 2 days or worsen.": "લક્ષણો 2 દિવસથી વધુ રહે અથવા વધે તો નજીકના PHC જાઓ.",
        "This gives quick guidance only. It is not a doctor's final advice. If you feel worse or feel unsafe, go to a doctor or hospital.": "આ ફક્ત ઝડપી માર્ગદર્શન માટે છે. આ ડૉક્ટરની અંતિમ સલાહ નથી. હાલત ખરાબ થાય અથવા ભય લાગે તો ડૉક્ટર અથવા હોસ્પિટલમાં જાઓ.",
    },
    "mr": {
        "Possible cardiac emergency. Call 108 or go to the nearest emergency department now.": "हृदय किंवा छातीशी संबंधित आपत्कालीन स्थिती असू शकते. लगेच 108 वर कॉल करा किंवा जवळच्या रुग्णालयात जा.",
        "Breathing difficulty can become life-threatening. Get emergency help immediately.": "श्वास घेण्यास त्रास धोकादायक ठरू शकतो. तात्काळ आपत्कालीन मदत घ्या.",
        "Heavy bleeding needs urgent emergency care. Apply direct pressure and call 108.": "जास्त रक्तस्त्राव होत आहे. दाब द्या आणि तात्काळ 108 वर कॉल करा.",
        "Loss of consciousness or seizures require emergency evaluation immediately.": "बेशुद्ध पडणे किंवा झटके आल्यास तात्काळ आपत्कालीन तपासणी आवश्यक आहे.",
        "Possible stroke. Emergency treatment is time-critical, so seek immediate care.": "स्ट्रोक असू शकतो. वेळेवर उपचार खूप महत्त्वाचे आहेत, त्यामुळे लगेच रुग्णालयात जा.",
        "Your symptoms include emergency warning signs that need immediate medical attention.": "तुमच्या लक्षणांमध्ये आपत्कालीन इशारे आहेत आणि त्वरित उपचारांची गरज आहे.",
        "Persistent fever, cough, diarrhea, vomiting, or worsening symptoms should be checked at a clinic soon.": "सतत ताप, खोकला, जुलाब, उलटी किंवा वाढणारी लक्षणे असल्यास लवकर क्लिनिक किंवा PHC मध्ये जा.",
        "Severe pain, swelling, or signs of infection should be assessed by a clinician.": "तीव्र वेदना, सूज किंवा संसर्गाची चिन्हे डॉक्टरांनी तपासणे आवश्यक आहे.",
        "Mild symptoms can be monitored at home for now if there are no danger signs.": "धोक्याची चिन्हे नसतील तर सौम्य लक्षणांवर सध्या घरी लक्ष ठेवता येते.",
        "Call 108 or go to the nearest emergency department now.": "लगेच 108 वर कॉल करा किंवा जवळच्या आपत्कालीन रुग्णालयात जा.",
        "Do not rely on home remedies for these symptoms.": "या लक्षणांसाठी फक्त घरगुती उपायांवर अवलंबून राहू नका.",
        "If possible, have someone stay with you while you seek help.": "शक्य असल्यास मदत मिळेपर्यंत कोणीतरी तुमच्यासोबत राहू द्या.",
        "Visit the nearest PHC or clinic within the next 24 to 48 hours.": "पुढील 24 ते 48 तासांत जवळच्या PHC किंवा क्लिनिकला जा.",
        "Monitor whether the symptoms are lasting longer, getting worse, or spreading.": "लक्षणे किती काळ आहेत, वाढत आहेत का, किंवा पसरत आहेत का ते पाहा.",
        "Go sooner if you develop chest pain, breathing trouble, confusion, or fainting.": "छातीत दुखणे, श्वासाचा त्रास, गोंधळ किंवा बेशुद्धी आल्यास आणखी लवकर जा.",
        "Rest, drink safe fluids, and monitor symptoms for the next 24 hours.": "विश्रांती घ्या, सुरक्षित द्रव प्या आणि पुढील 24 तास लक्षणांवर लक्ष ठेवा.",
        "Use basic home care only if symptoms stay mild and there are no danger signs.": "लक्षणे सौम्य राहिली आणि धोक्याची चिन्हे नसतील तरच साधी घरगुती काळजी घ्या.",
        "Visit the nearest PHC if symptoms continue beyond 2 days or worsen.": "लक्षणे 2 दिवसांपेक्षा जास्त टिकली किंवा वाढली तर जवळच्या PHC ला जा.",
        "This gives quick guidance only. It is not a doctor's final advice. If you feel worse or feel unsafe, go to a doctor or hospital.": "ही फक्त झटपट मार्गदर्शनासाठी आहे. ही डॉक्टरांची अंतिम सल्ला नाही. तब्येत बिघडली किंवा काळजी वाटली तर डॉक्टरांकडे किंवा रुग्णालयात जा.",
    },
    "ta": {
        "Possible cardiac emergency. Call 108 or go to the nearest emergency department now.": "இதயம் அல்லது மார்பு தொடர்பான அவசரநிலை இருக்கலாம். உடனே 108-க்கு அழைக்கவும் அல்லது அருகிலுள்ள மருத்துவமனைக்கு செல்லவும்.",
        "Breathing difficulty can become life-threatening. Get emergency help immediately.": "மூச்சுத் திணறல் ஆபத்தான நிலையாக மாறலாம். உடனடி அவசர உதவி பெறுங்கள்.",
        "Heavy bleeding needs urgent emergency care. Apply direct pressure and call 108.": "அதிக ரத்தப்போக்கு உள்ளது. நேரடியாக அழுத்தம் கொடுத்து உடனே 108-க்கு அழைக்கவும்.",
        "Loss of consciousness or seizures require emergency evaluation immediately.": "மயக்கம் அல்லது வலிப்பு இருந்தால் உடனடி அவசர சிகிச்சை தேவை.",
        "Possible stroke. Emergency treatment is time-critical, so seek immediate care.": "ஸ்ட்ரோக் இருக்கலாம். உடனடி சிகிச்சை முக்கியம், எனவே உடனே மருத்துவமனை செல்லவும்.",
        "Your symptoms include emergency warning signs that need immediate medical attention.": "உங்கள் அறிகுறிகளில் உடனடி சிகிச்சை தேவைப்படும் அவசர எச்சரிக்கை அறிகுறிகள் உள்ளன.",
        "Persistent fever, cough, diarrhea, vomiting, or worsening symptoms should be checked at a clinic soon.": "நீடித்த காய்ச்சல், இருமல், வயிற்றுப்போக்கு, வாந்தி அல்லது மோசமடையும் அறிகுறிகள் இருந்தால் விரைவில் கிளினிக் அல்லது PHC செல்லவும்.",
        "Severe pain, swelling, or signs of infection should be assessed by a clinician.": "கடுமையான வலி, வீக்கம் அல்லது தொற்று அறிகுறிகளை மருத்துவர் பரிசோதிக்க வேண்டும்.",
        "Mild symptoms can be monitored at home for now if there are no danger signs.": "ஆபத்து அறிகுறிகள் இல்லையெனில் இலகு அறிகுறிகளை இப்போது வீட்டில் கண்காணிக்கலாம்.",
        "Call 108 or go to the nearest emergency department now.": "உடனே 108-க்கு அழைக்கவும் அல்லது அருகிலுள்ள அவசர மருத்துவமனைக்கு செல்லவும்.",
        "Do not rely on home remedies for these symptoms.": "இந்த அறிகுறிகளுக்கு வீட்டுவைதியத்தை மட்டும் நம்ப வேண்டாம்.",
        "If possible, have someone stay with you while you seek help.": "சாத்தியமானால் உதவி பெறும் வரை யாராவது உங்களுடன் இருக்கட்டும்.",
        "Visit the nearest PHC or clinic within the next 24 to 48 hours.": "அடுத்த 24 முதல் 48 மணி நேரத்திற்குள் அருகிலுள்ள PHC அல்லது கிளினிக் செல்லவும்.",
        "Monitor whether the symptoms are lasting longer, getting worse, or spreading.": "அறிகுறிகள் நீளமாக உள்ளதா, மோசமடைகிறதா அல்லது பரவுகிறதா என்பதை கவனிக்கவும்.",
        "Go sooner if you develop chest pain, breathing trouble, confusion, or fainting.": "மார்பு வலி, மூச்சுத் திணறல், குழப்பம் அல்லது மயக்கம் ஏற்பட்டால் இன்னும் சீக்கிரம் செல்லவும்.",
        "Rest, drink safe fluids, and monitor symptoms for the next 24 hours.": "ஓய்வு எடுக்கவும், பாதுகாப்பான திரவங்களை குடிக்கவும், அடுத்த 24 மணி நேரம் அறிகுறிகளை கவனிக்கவும்.",
        "Use basic home care only if symptoms stay mild and there are no danger signs.": "அறிகுறிகள் இலகுவாகவே இருந்து ஆபத்து அறிகுறிகள் இல்லாதபோது மட்டுமே சாதாரண வீட்டு பராமரிப்பு செய்யவும்.",
        "Visit the nearest PHC if symptoms continue beyond 2 days or worsen.": "அறிகுறிகள் 2 நாட்களுக்கு மேல் நீடித்தால் அல்லது மோசமடைந்தால் அருகிலுள்ள PHC செல்லவும்.",
        "This gives quick guidance only. It is not a doctor's final advice. If you feel worse or feel unsafe, go to a doctor or hospital.": "இது விரைவான வழிகாட்டுதலுக்கு மட்டும். இது மருத்துவரின் இறுதி ஆலோசனை அல்ல. நிலை மோசமாகினால் அல்லது பயமாக இருந்தால் மருத்துவரையோ மருத்துவமனையையோ அணுகுங்கள்.",
    },
}

def _contains_script(text: str, start: str, end: str) -> bool:
    return bool(re.search(f"[{start}-{end}]", text))


def _normalize_language_code(language: Optional[str]) -> str:
    if not language:
        return "en"
    return language.strip().lower().replace("_", "-").split("-")[0]


def _local_detect_language(text: str) -> str:
    if not text.strip():
        return "en"

    if _contains_script(text, "\u0A80", "\u0AFF"):
        return "gu"
    if _contains_script(text, "\u0B80", "\u0BFF"):
        return "ta"
    if _contains_script(text, "\u0900", "\u097F"):
        marathi_markers = ["मला", "आहे", "छातीत", "श्वास", "डोकेदुखी", "खोकला", "जुलाब"]
        if any(marker in text for marker in marathi_markers):
            return "mr"
        return "hi"

    return "en"


async def _google_detect_language(text: str) -> Optional[str]:
    if not settings.has_google_translate or not text.strip():
        return None

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.post(
                f"{GOOGLE_TRANSLATE_URL}/detect",
                params={
                    "q": text,
                    "key": settings.GOOGLE_TRANSLATE_API_KEY,
                },
            )
            response.raise_for_status()
    except Exception as exc:
        print(f"[Translator] Google language detection failed: {exc}")
        return None

    detections = response.json().get("data", {}).get("detections", [])
    if not detections or not detections[0]:
        return None

    detected = _normalize_language_code(detections[0][0].get("language"))
    return detected if detected in SUPPORTED_LANGUAGES else None


async def _google_translate_texts(
    texts: List[str],
    target_lang: str,
    source_lang: Optional[str] = None,
) -> Optional[List[str]]:
    cleaned_texts = [text for text in texts if text.strip()]
    if not settings.has_google_translate or not cleaned_texts:
        return None

    params: List[tuple[str, str]] = [
        ("target", target_lang),
        ("format", "text"),
        ("key", settings.GOOGLE_TRANSLATE_API_KEY),
    ]
    params.extend(("q", text) for text in texts)

    normalized_source = _normalize_language_code(source_lang)
    if source_lang and normalized_source:
        params.append(("source", normalized_source))

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(GOOGLE_TRANSLATE_URL, params=params)
            response.raise_for_status()
    except Exception as exc:
        print(f"[Translator] Google translation failed: {exc}")
        return None

    translations = response.json().get("data", {}).get("translations", [])
    translated_texts = [
        html.unescape(item.get("translatedText", "")).strip()
        for item in translations
    ]
    if len(translated_texts) != len(texts) or any(not text for text in translated_texts):
        return None
    return translated_texts


async def detect_language(text: str) -> str:
    """Detect language using script ranges and a few marker words."""
    google_detected = await _google_detect_language(text)
    if google_detected:
        return google_detected
    return _local_detect_language(text)


async def translate_to_english(text: str, source_lang: Optional[str] = None) -> str:
    """Normalize supported regional-language symptom phrases into English concepts."""
    if not text.strip():
        return text

    language = _normalize_language_code(source_lang) if source_lang else await detect_language(text)
    if language == "en":
        return text

    google_translation = await _google_translate_texts([text], target_lang="en", source_lang=language)
    if google_translation:
        return google_translation[0]

    normalized = text.lower()
    replacements = TERM_MAP.get(language, {})
    for source, target in sorted(replacements.items(), key=lambda item: len(item[0]), reverse=True):
        normalized = normalized.replace(source.lower(), target)
    return normalized


async def translate_from_english(text: str, target_lang: str) -> str:
    """Localize known response phrases back into the user's language."""
    normalized_target = _normalize_language_code(target_lang)
    if normalized_target == "en" or normalized_target not in SUPPORTED_LANGUAGES:
        return text

    google_translation = await _google_translate_texts([text], target_lang=normalized_target, source_lang="en")
    if google_translation:
        return google_translation[0]

    return STATIC_TRANSLATIONS.get(normalized_target, {}).get(text, text)


async def translate_text_list(texts: List[str], target_lang: str) -> List[str]:
    """Localize a list of response strings."""
    normalized_target = _normalize_language_code(target_lang)
    if normalized_target == "en" or normalized_target not in SUPPORTED_LANGUAGES:
        return texts

    google_translation = await _google_translate_texts(texts, target_lang=normalized_target, source_lang="en")
    if google_translation:
        return google_translation

    return [await translate_from_english(text, normalized_target) for text in texts]
