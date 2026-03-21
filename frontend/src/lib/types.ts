export interface Message {
  id: string;
  role: 'user' | 'bot';
  type: 'text' | 'triage' | 'remedies' | 'emergency' | 'hospitals' | 'report' | 'audio';
  content: string;
  data?: TriageData | Hospital[] | PatientReport;
  imageUrl?: string;
  timestamp: Date;
}

export interface TriageData {
  triage: 'self-care' | 'clinic' | 'emergency';
  reason: string;
  confidence: number;
  remedies: string[];
}

export interface Hospital {
  name: string;
  lat: number;
  lng: number;
  distance: string;
  contact: string;
}

export interface PatientReport {
  symptoms: string[];
  triage: string;
  advice: string;
  timestamp: string;
}

export interface AnalyzeRequest {
  text?: string;
  voice_text?: string;
  image?: string;
  language: string;
  location?: { lat: number; lng: number };
  session_id: string;
  channel: 'web';
}

export interface AnalyzeResponse {
  triage: 'self-care' | 'clinic' | 'emergency';
  reason: string;
  confidence: number;
  remedies: string[];
  audio_url?: string;
  hospitals?: Hospital[];
  report?: PatientReport;
}

export type Language = 'en' | 'hi' | 'gu' | 'mr' | 'ta';

export const LANGUAGES: { code: Language; label: string; flag: string; script: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧', script: 'I have a fever' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳', script: 'मुझे बुखार है' },
  { code: 'gu', label: 'ગુજરાતી', flag: '🇮🇳', script: 'મને તાવ છે' },
  { code: 'mr', label: 'मराठी', flag: '🇮🇳', script: 'मला ताप आहे' },
  { code: 'ta', label: 'தமிழ்', flag: '🇮🇳', script: 'எனக்கு காய்ச்சல்' },
];

export const QUICK_SYMPTOMS = [
  { emoji: '🤒', text: 'Fever' },
  { emoji: '💢', text: 'Pain' },
  { emoji: '🤕', text: 'Headache' },
  { emoji: '🩹', text: 'Wound' },
  { emoji: '😮‍💨', text: 'Breathing Issue' },
  { emoji: '🩸', text: 'Bleeding' },
];
