import { motion } from 'framer-motion';
import { X, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  reason: string;
  onDismiss: () => void;
}

export default function EmergencyAlert({ reason, onDismiss }: Props) {
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ type: 'spring', damping: 15, stiffness: 200 }}
      className="bg-emergency text-accent-foreground p-4 rounded-b-xl relative"
    >
      <button onClick={onDismiss} className="absolute top-3 right-3 text-accent-foreground/70 hover:text-accent-foreground" aria-label="Dismiss">
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-3">
        <span className="text-2xl">🚨</span>
        <div>
          <h3 className="font-heading font-bold text-sm">EMERGENCY DETECTED</h3>
          <p className="text-xs text-accent-foreground/80">{reason}</p>
        </div>
      </div>
      <a href="tel:108" className="mt-3 inline-block">
        <Button variant="emergencyCall" size="sm" className="gap-2">
          <Phone className="w-4 h-4" /> Call Ambulance (108)
        </Button>
      </a>
    </motion.div>
  );
}
