import { motion } from 'framer-motion';
import { QUICK_SYMPTOMS } from '@/lib/types';

interface Props {
  onSelect: (symptom: string) => void;
}

export default function QuickSymptomButtons({ onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_SYMPTOMS.map(({ emoji, text }) => (
        <motion.button
          key={text}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(`I have ${text.toLowerCase()}`)}
          className="px-4 py-2 rounded-full border-2 border-teal bg-card text-foreground text-sm font-medium hover:bg-teal hover:text-accent-foreground transition-colors active:scale-[0.97]"
        >
          {emoji} {text}
        </motion.button>
      ))}
    </div>
  );
}
