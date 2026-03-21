import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

export default function FloatingChatButton() {
  const scrollToChat = () => {
    document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.button
      onClick={scrollToChat}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full gradient-cta flex items-center justify-center shadow-teal hover:shadow-lg transition-shadow active:scale-[0.95]"
      animate={{ scale: [1, 1.08, 1] }}
      transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
      aria-label="Open chat"
    >
      <MessageCircle className="w-6 h-6 text-accent-foreground" />
    </motion.button>
  );
}
