export interface Message {
  id: string;
  role: 'user' | 'bot';
  type: 'text' | 'triage' | 'actions' | 'facilities';
  content: string;
  data?: TriageData | FacilityInfo[];
  language?: Language;
  imageUrl?: string;
  timestamp: Date;
}

export interface LocationData {
  lat: number;
  lng: number;
}

export interface FacilityInfo {
  name: string;
  facility_type: 'phc' | 'chc' | 'hospital';
  lat: number;
  lng: number;
  distance_km: number;
  distance_text: string;
  contact?: string | null;
  recommended_for: Array<'clinic' | 'emergency'>;
}

export interface TriageData {
  triage: 'self-care' | 'clinic' | 'emergency';
  reason: string;
  confidence: number;
  recommendedActions: string[];
  disclaimer: string;
  facilities: FacilityInfo[];
  language: Language;
}

export interface AnalyzeRequest {
  text?: string;
  voice_text?: string;
  language: Language;
  session_id?: string;
  channel: 'web';
  location?: LocationData;
}

export interface AnalyzeResponse {
  session_id: string;
  language: Language;
  triage: 'self-care' | 'clinic' | 'emergency';
  reason: string;
  confidence: number;
  recommended_actions: string[];
  facilities: FacilityInfo[];
  is_emergency: boolean;
  disclaimer: string;
}

export type Language = 'en' | 'hi' | 'gu' | 'mr' | 'ta';

export const LANGUAGES: { code: Language; label: string; flag: string; script: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧', script: 'I have a fever' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳', script: 'मुझे बुखार है' },
  { code: 'gu', label: 'ગુજરાતી', flag: '🇮🇳', script: 'મને તાવ છે' },
  { code: 'mr', label: 'मराठी', flag: '🇮🇳', script: 'मला ताप आहे' },
  { code: 'ta', label: 'தமிழ்', flag: '🇮🇳', script: 'எனக்கு காய்ச்சல்' },
];

export const SPEECH_LOCALES: Record<Language, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  gu: 'gu-IN',
  mr: 'mr-IN',
  ta: 'ta-IN',
};

export const UI_STRINGS: Record<Language, {
  welcome: string;
  actionsTitle: string;
  facilitiesTitle: string;
  immediateStep: string;
  locationPrompt: string;
  enableLocation: string;
  locationReady: string;
  locationBlocked: string;
  voiceUnavailable: string;
  apiError: string;
  placeholder: string;
  selfCareBadge: string;
  clinicBadge: string;
  emergencyBadge: string;
  distanceLabel: string;
  callLabel: string;
  directionsLabel: string;
  listening: string;
}> = {
  en: {
    welcome: 'Welcome to SwasthAI.\nTell us your problem by typing or speaking.\nIf you share location, we can also show a nearby place for care.',
    actionsTitle: 'Recommended next steps',
    facilitiesTitle: 'Nearby care options',
    immediateStep: 'Immediate next step',
    locationPrompt: 'Share location if you want to see a nearby health centre or hospital on the map.',
    enableLocation: 'Use my location',
    locationReady: 'Location enabled for facility recommendations.',
    locationBlocked: 'Location unavailable. Triage still works, but nearby facility suggestions will be limited.',
    voiceUnavailable: 'Voice input is not supported in this browser yet. Please type your symptoms instead.',
    apiError: 'I could not analyze that message right now.',
    placeholder: 'Describe your symptoms or tap the mic...',
    selfCareBadge: 'Home Care',
    clinicBadge: 'Go To Clinic',
    emergencyBadge: 'Emergency',
    distanceLabel: 'Distance',
    callLabel: 'Call',
    directionsLabel: 'Map',
    listening: 'Listening',
  },
  hi: {
    welcome: 'SwasthAI में आपका स्वागत है।\nअपनी परेशानी लिखकर या बोलकर बताइए।\nलोकेशन देने पर हम नजदीकी इलाज की जगह भी दिखा सकते हैं।',
    actionsTitle: 'अगले कदम',
    facilitiesTitle: 'नजदीकी चिकित्सा विकल्प',
    immediateStep: 'तुरंत अगला कदम',
    locationPrompt: 'अगर आप नजदीकी स्वास्थ्य केन्द्र या अस्पताल नक्शे पर देखना चाहते हैं तो लोकेशन साझा करें।',
    enableLocation: 'मेरी लोकेशन उपयोग करें',
    locationReady: 'सुविधा सुझावों के लिए लोकेशन चालू है।',
    locationBlocked: 'लोकेशन उपलब्ध नहीं है। ट्रायज चलेगा, लेकिन नजदीकी सुविधा सुझाव सीमित रहेंगे।',
    voiceUnavailable: 'इस ब्राउज़र में वॉइस इनपुट अभी उपलब्ध नहीं है। कृपया लक्षण टाइप करें।',
    apiError: 'मैं अभी इस संदेश का विश्लेषण नहीं कर सका।',
    placeholder: 'अपने लक्षण लिखें या माइक्रोफोन दबाएं...',
    selfCareBadge: 'घर पर देखभाल',
    clinicBadge: 'क्लिनिक जाएं',
    emergencyBadge: 'आपातकाल',
    distanceLabel: 'दूरी',
    callLabel: 'कॉल करें',
    directionsLabel: 'नक्शा',
    listening: 'सुन रहा है',
  },
  gu: {
    welcome: 'SwasthAI માં આપનું સ્વાગત છે.\nતમારી તકલીફ લખીને અથવા બોલીને કહો.\nસ્થાન આપશો તો અમે નજીકની સારવારની જગ્યા પણ બતાવી શકીશું.',
    actionsTitle: 'આગળ શું કરવું',
    facilitiesTitle: 'નજીકની સારવાર સુવિધાઓ',
    immediateStep: 'તાત્કાલિક આગળનું પગલું',
    locationPrompt: 'નજીકનું આરોગ્ય કેન્દ્ર અથવા હોસ્પિટલ નકશામાં જોવા માટે સ્થાન શેર કરો.',
    enableLocation: 'મારું સ્થાન વાપરો',
    locationReady: 'સુવિધા સૂચનો માટે સ્થાન સક્રિય છે.',
    locationBlocked: 'સ્થાન ઉપલબ્ધ નથી. ટ્રાયજ ચાલશે, પરંતુ નજીકની સુવિધા સૂચનાઓ મર્યાદિત રહેશે.',
    voiceUnavailable: 'આ બ્રાઉઝરમાં વૉઇસ ઇનપુટ હજુ ઉપલબ્ધ નથી. કૃપા કરીને લક્ષણો લખો.',
    apiError: 'હું અત્યારે આ સંદેશનું વિશ્લેષણ કરી શક્યો નથી.',
    placeholder: 'તમારા લક્ષણો લખો અથવા માઇક દબાવો...',
    selfCareBadge: 'ઘરે કાળજી',
    clinicBadge: 'ક્લિનિક જાઓ',
    emergencyBadge: 'ઇમરજન્સી',
    distanceLabel: 'અંતર',
    callLabel: 'કૉલ',
    directionsLabel: 'નકશો',
    listening: 'સાંભળી રહ્યું છે',
  },
  mr: {
    welcome: 'SwasthAI मध्ये आपले स्वागत आहे.\nतुमची अडचण लिहा किंवा बोलून सांगा.\nलोकेशन दिल्यास आम्ही जवळची उपचाराची जागा दाखवू शकतो.',
    actionsTitle: 'पुढील पावले',
    facilitiesTitle: 'जवळचे उपचार पर्याय',
    immediateStep: 'ताबडतोब पुढचे पाऊल',
    locationPrompt: 'जवळचे आरोग्य केंद्र किंवा रुग्णालय नकाशावर पाहण्यासाठी लोकेशन शेअर करा.',
    enableLocation: 'माझे लोकेशन वापरा',
    locationReady: 'सुविधा सूचनांसाठी लोकेशन सुरू आहे.',
    locationBlocked: 'लोकेशन उपलब्ध नाही. ट्रायज चालेल, पण जवळच्या सुविधा सूचना मर्यादित राहतील.',
    voiceUnavailable: 'या ब्राउझरमध्ये व्हॉइस इनपुट अजून उपलब्ध नाही. कृपया लक्षणे टाइप करा.',
    apiError: 'मी आत्ता या संदेशाचे विश्लेषण करू शकलो नाही.',
    placeholder: 'तुमची लक्षणे लिहा किंवा माइक दाबा...',
    selfCareBadge: 'घरी काळजी',
    clinicBadge: 'क्लिनिकला जा',
    emergencyBadge: 'आपत्काल',
    distanceLabel: 'अंतर',
    callLabel: 'कॉल',
    directionsLabel: 'नकाशा',
    listening: 'ऐकत आहे',
  },
  ta: {
    welcome: 'SwasthAI-க்கு வரவேற்கிறோம்.\nஉங்கள் பிரச்சனையை எழுதி அல்லது பேசி சொல்லுங்கள்.\nஇருப்பிடம் பகிர்ந்தால் அருகிலுள்ள சிகிச்சை இடத்தையும் காட்டலாம்.',
    actionsTitle: 'அடுத்த படிகள்',
    facilitiesTitle: 'அருகிலுள்ள சிகிச்சை மையங்கள்',
    immediateStep: 'உடனடி அடுத்த செயல்',
    locationPrompt: 'அருகிலுள்ள சுகாதார மையம் அல்லது மருத்துவமனை வரைபடத்தில் பார்க்க இருப்பிடத்தை பகிரவும்.',
    enableLocation: 'என் இருப்பிடத்தை பயன்படுத்து',
    locationReady: 'சிகிச்சை மைய பரிந்துரைகளுக்கு இருப்பிடம் செயல்பாட்டில் உள்ளது.',
    locationBlocked: 'இருப்பிடம் கிடைக்கவில்லை. டிரையாஜ் வேலை செய்யும், ஆனால் அருகிலுள்ள மைய பரிந்துரைகள் குறையும்.',
    voiceUnavailable: 'இந்த உலாவியில் குரல் உள்ளீடு இன்னும் இல்லை. தயவுசெய்து அறிகுறிகளை தட்டச்சு செய்யவும்.',
    apiError: 'இந்த செய்தியை இப்போது பகுப்பாய்வு செய்ய முடியவில்லை.',
    placeholder: 'அறிகுறிகளை எழுதுங்கள் அல்லது மைக்கை அழுத்துங்கள்...',
    selfCareBadge: 'வீட்டு பராமரிப்பு',
    clinicBadge: 'கிளினிக்கிற்கு செல்லவும்',
    emergencyBadge: 'அவசரம்',
    distanceLabel: 'தூரம்',
    callLabel: 'அழைக்கவும்',
    directionsLabel: 'வரைபடம்',
    listening: 'கேட்கிறது',
  },
};

export const QUICK_SYMPTOMS = [
  { emoji: '🤒', text: 'Fever' },
  { emoji: '💢', text: 'Pain' },
  { emoji: '🤕', text: 'Headache' },
  { emoji: '🩹', text: 'Wound' },
  { emoji: '😮‍💨', text: 'Breathing Issue' },
  { emoji: '🩸', text: 'Bleeding' },
];
