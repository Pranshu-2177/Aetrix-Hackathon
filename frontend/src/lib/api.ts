import { AnalyzeRequest, AnalyzeResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function analyzeSymptoms(data: AnalyzeRequest): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('API request failed');
  return res.json();
}

export async function getNearbyHospitals(lat: number, lng: number) {
  const res = await fetch(`${API_BASE_URL}/hospitals/nearby?lat=${lat}&lng=${lng}`);
  if (!res.ok) throw new Error('Hospital lookup failed');
  return res.json();
}

// Mock response for demo when backend is unavailable
export function getMockResponse(text: string): AnalyzeResponse {
  const lower = text.toLowerCase();
  const isEmergency = lower.includes('chest pain') || lower.includes('bleeding heavily') || lower.includes('unconscious');
  const isClinic = lower.includes('wound') || lower.includes('pain') || lower.includes('breathing');

  if (isEmergency) {
    return {
      triage: 'emergency',
      reason: 'Potential life-threatening symptoms detected',
      confidence: 0.92,
      remedies: ['Call emergency services immediately', 'Do not move the patient', 'Keep the patient calm'],
      hospitals: [
        { name: 'City General Hospital', lat: 23.0225, lng: 72.5714, distance: '1.8 km', contact: '079-26300001' },
        { name: 'Apollo Hospital', lat: 23.0350, lng: 72.5560, distance: '3.2 km', contact: '079-66701800' },
      ],
    };
  }

  if (isClinic) {
    return {
      triage: 'clinic',
      reason: 'Symptoms suggest professional medical evaluation needed',
      confidence: 0.78,
      remedies: ['Visit a clinic within 24 hours', 'Apply ice pack to affected area', 'Take OTC pain relief if needed', 'Monitor symptoms closely'],
      hospitals: [
        { name: 'MedPlus Clinic', lat: 23.0180, lng: 72.5650, distance: '0.9 km', contact: '079-40032000' },
      ],
    };
  }

  return {
    triage: 'self-care',
    reason: 'Symptoms appear manageable with home care',
    confidence: 0.85,
    remedies: ['Rest adequately and stay hydrated', 'Take paracetamol for fever (if above 100°F)', 'Gargle with warm salt water for sore throat', 'Monitor temperature every 4 hours'],
    report: {
      symptoms: [text],
      triage: 'self-care',
      advice: 'Your symptoms suggest a minor condition that can be managed at home. Stay hydrated, rest, and monitor. Consult a doctor if symptoms worsen or persist beyond 3 days.',
      timestamp: new Date().toISOString(),
    },
  };
}
