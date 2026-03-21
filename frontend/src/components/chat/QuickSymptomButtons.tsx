import { motion } from 'framer-motion';
import type { Language } from '@/lib/types';

const QUICK_SYMPTOMS = [
  {
    emoji: '🤒',
    label: { en: 'Fever', hi: 'बुखार', gu: 'તાવ', mr: 'ताप', ta: 'காய்ச்சல்' },
    text: {
      en: 'I have fever',
      hi: 'मुझे बुखार है',
      gu: 'મને તાવ છે',
      mr: 'मला ताप आहे',
      ta: 'எனக்கு காய்ச்சல் உள்ளது',
    },
  },
  {
    emoji: '💢',
    label: { en: 'Pain', hi: 'दर्द', gu: 'દુખાવો', mr: 'वेदना', ta: 'வலி' },
    text: {
      en: 'I have pain',
      hi: 'मुझे दर्द है',
      gu: 'મને દુખાવો છે',
      mr: 'मला वेदना आहेत',
      ta: 'எனக்கு வலி உள்ளது',
    },
  },
  {
    emoji: '🤕',
    label: { en: 'Headache', hi: 'सिरदर्द', gu: 'માથાનો દુખાવો', mr: 'डोकेदुखी', ta: 'தலைவலி' },
    text: {
      en: 'I have headache',
      hi: 'मुझे सिरदर्द है',
      gu: 'મને માથાનો દુખાવો છે',
      mr: 'मला डोकेदुखी आहे',
      ta: 'எனக்கு தலைவலி உள்ளது',
    },
  },
  {
    emoji: '🩹',
    label: { en: 'Wound', hi: 'घाव', gu: 'જખમ', mr: 'जखम', ta: 'காயம்' },
    text: {
      en: 'I have a wound',
      hi: 'मुझे घाव है',
      gu: 'મને જખમ છે',
      mr: 'मला जखम आहे',
      ta: 'எனக்கு காயம் உள்ளது',
    },
  },
  {
    emoji: '😮‍💨',
    label: { en: 'Breathing', hi: 'सांस की दिक्कत', gu: 'શ્વાસ તકલીફ', mr: 'श्वास त्रास', ta: 'மூச்சுத்திணறல்' },
    text: {
      en: 'I have difficulty breathing',
      hi: 'मुझे सांस लेने में तकलीफ है',
      gu: 'મને શ્વાસ લેવામાં તકલીફ છે',
      mr: 'मला श्वास घेण्यास त्रास आहे',
      ta: 'எனக்கு மூச்சுத்திணறல் உள்ளது',
    },
  },
  {
    emoji: '🩸',
    label: { en: 'Bleeding', hi: 'खून बह रहा है', gu: 'લોહી વહે છે', mr: 'रक्तस्त्राव', ta: 'ரத்தப்போக்கு' },
    text: {
      en: 'I have bleeding',
      hi: 'मुझे खून बह रहा है',
      gu: 'મને લોહી વહે છે',
      mr: 'मला रक्तस्त्राव होत आहे',
      ta: 'எனக்கு ரத்தப்போக்கு உள்ளது',
    },
  },
];

interface Props {
  onSelect: (symptom: string) => void;
  language: Language;
}

export default function QuickSymptomButtons({ onSelect, language }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_SYMPTOMS.map(({ emoji, label, text }) => (
        <motion.button
          key={label.en}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(text[language])}
          className="px-4 py-2 rounded-full border-2 border-teal bg-card text-foreground text-sm font-medium hover:bg-teal hover:text-accent-foreground transition-colors active:scale-[0.97]"
        >
          {emoji} {label[language]}
        </motion.button>
      ))}
    </div>
  );
}
