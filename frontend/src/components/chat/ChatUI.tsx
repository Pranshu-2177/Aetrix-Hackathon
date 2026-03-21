import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import MessageBubble from './MessageBubble';
import InputBar from './InputBar';
import QuickSymptomButtons from './QuickSymptomButtons';
import LanguageSelector from './LanguageSelector';
import EmergencyAlert from './EmergencyAlert';
import { getMockResponse } from '@/lib/api';
import type { Message, Language, TriageData } from '@/lib/types';

const welcomeMessage: Message = {
  id: 'welcome',
  role: 'bot',
  type: 'text',
  content: '🩺 Welcome to SwasthAI!\nTell me your symptoms — type, speak, or send an image.\nI can help in English, Hindi, Gujarati, Marathi, and Tamil.',
  timestamp: new Date(),
};

export default function ChatUI() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [language, setLanguage] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(false);
  const [emergency, setEmergency] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 50);
  };

  useEffect(scrollToBottom, [messages]);

  const processResponse = useCallback((text: string) => {
    setIsLoading(true);
    setTimeout(() => {
      const resp = getMockResponse(text);
      const newMessages: Message[] = [];

      // Triage message
      newMessages.push({
        id: crypto.randomUUID(),
        role: 'bot',
        type: 'triage',
        content: resp.reason,
        data: { triage: resp.triage, reason: resp.reason, confidence: resp.confidence, remedies: resp.remedies } as TriageData,
        timestamp: new Date(),
      });

      // Remedies
      if (resp.remedies.length) {
        newMessages.push({
          id: crypto.randomUUID(),
          role: 'bot',
          type: 'remedies',
          content: 'Here are some recommendations:',
          data: { triage: resp.triage, reason: resp.reason, confidence: resp.confidence, remedies: resp.remedies } as TriageData,
          timestamp: new Date(),
        });
      }

      // Emergency
      if (resp.triage === 'emergency') {
        setEmergency(resp.reason);
        if (navigator.vibrate) navigator.vibrate(500);
      }

      // Hospitals
      if (resp.hospitals?.length) {
        newMessages.push({
          id: crypto.randomUUID(),
          role: 'bot',
          type: 'hospitals',
          content: 'Nearby hospitals:',
          data: resp.hospitals,
          timestamp: new Date(),
        });
      }

      // Report
      if (resp.report) {
        newMessages.push({
          id: crypto.randomUUID(),
          role: 'bot',
          type: 'report',
          content: 'Here is your summary report:',
          data: resp.report,
          timestamp: new Date(),
        });
      }

      setMessages(prev => [...prev, ...newMessages]);
      setIsLoading(false);
    }, 1200);
  }, []);

  const handleSendText = (text: string) => {
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(), role: 'user', type: 'text', content: text, timestamp: new Date(),
    }]);
    processResponse(text);
  };

  const handleSendImage = (base64: string) => {
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(), role: 'user', type: 'text', content: 'Sent an image for analysis', imageUrl: base64, timestamp: new Date(),
    }]);
    processResponse('wound analysis from image');
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-navy px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-primary-foreground/70 hover:text-primary-foreground" aria-label="Go back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-cta flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-accent-foreground" />
            </div>
            <span className="font-heading font-bold text-primary-foreground text-sm">SwasthAI</span>
          </div>
        </div>
        <LanguageSelector value={language} onChange={setLanguage} />
      </div>

      {/* Emergency */}
      <AnimatePresence>
        {emergency && <EmergencyAlert reason={emergency} onDismiss={() => setEmergency(null)} />}
      </AnimatePresence>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {/* Quick symptoms on mobile */}
        <div className="md:hidden mb-4">
          <QuickSymptomButtons onSelect={handleSendText} />
        </div>

        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 pl-9">
            <div className="bg-card border border-border rounded-2xl px-4 py-3 flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  className="w-2 h-2 rounded-full bg-teal"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <InputBar
        onSendText={handleSendText}
        onSendImage={handleSendImage}
        onSendVoice={handleSendText}
        disabled={isLoading}
      />
    </div>
  );
}
