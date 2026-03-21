import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Shield } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import AshaCaseForm from './AshaCaseForm';
import MessageBubble from './MessageBubble';
import InputBar from './InputBar';
import QuickSymptomButtons from './QuickSymptomButtons';
import LanguageSelector from './LanguageSelector';
import EmergencyAlert from './EmergencyAlert';
import { analyzeSymptoms, getOrCreateSessionId } from '@/lib/api';
import { UI_STRINGS, type AnalyzeRequest, type Language, type LocationData, type Message, type TriageData } from '@/lib/types';

type LocationStatus = 'idle' | 'loading' | 'ready' | 'blocked';
type ChatMode = 'patient' | 'asha';

interface ChatUIProps {
  embedded?: boolean;
  initialWelcome?: string;
  mode?: ChatMode;
}

export default function ChatUI({ embedded = false, initialWelcome, mode = 'patient' }: ChatUIProps) {
  const [language, setLanguage] = useState<Language>('en');
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'welcome',
      role: 'bot',
      type: 'text',
      content: initialWelcome || UI_STRINGS.en.welcome,
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [emergency, setEmergency] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [sessionId] = useState(() => getOrCreateSessionId());
  const scrollRef = useRef<HTMLDivElement>(null);
  const ui = UI_STRINGS[language];
  const isAshaMode = mode === 'asha';

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 50);
  };

  useEffect(scrollToBottom, [messages]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('blocked');
      return;
    }

    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({ lat: coords.latitude, lng: coords.longitude });
        setLocationStatus('ready');
      },
      () => {
        setLocationStatus('blocked');
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 300000,
      },
    );
  }, []);

  const processResponse = useCallback(async (payload: Pick<AnalyzeRequest, 'text' | 'voice_text'>) => {
    setIsLoading(true);
    try {
      const resp = await analyzeSymptoms({
        ...payload,
        language,
        session_id: sessionId,
        channel: 'web',
        location: location ?? undefined,
      });

      const responseLanguage = resp.language in UI_STRINGS ? resp.language : language;
      const responseUi = UI_STRINGS[responseLanguage];
      const triageData: TriageData = {
        triage: resp.triage,
        reason: resp.reason,
        confidence: resp.confidence,
        recommendedActions: resp.recommended_actions,
        disclaimer: resp.disclaimer,
        facilities: resp.facilities,
        language: responseLanguage,
      };

      const newMessages: Message[] = [];

      newMessages.push({
        id: crypto.randomUUID(),
        role: 'bot',
        type: 'triage',
        content: resp.reason,
        data: triageData,
        language: responseLanguage,
        timestamp: new Date(),
      });

      if (resp.recommended_actions.length) {
        newMessages.push({
          id: crypto.randomUUID(),
          role: 'bot',
          type: 'actions',
          content: responseUi.actionsTitle,
          data: triageData,
          language: responseLanguage,
          timestamp: new Date(),
        });
      }

      if (resp.facilities.length) {
        newMessages.push({
          id: crypto.randomUUID(),
          role: 'bot',
          type: 'facilities',
          content: responseUi.facilitiesTitle,
          data: resp.facilities,
          language: responseLanguage,
          timestamp: new Date(),
        });
      }

      if (resp.is_emergency) {
        setEmergency(resp.reason);
        if (navigator.vibrate) navigator.vibrate(500);
      } else {
        setEmergency(null);
      }

      setMessages(prev => [...prev, ...newMessages]);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unable to reach the backend right now.';
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'bot',
        type: 'text',
        content: `${ui.apiError} ${detail}`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [language, location, sessionId, ui.apiError]);

  const handleSendText = (text: string) => {
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(), role: 'user', type: 'text', content: text, timestamp: new Date(),
    }]);
    void processResponse({ text });
  };

  const handleBotNotice = (text: string) => {
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'bot',
      type: 'text',
      content: text,
      timestamp: new Date(),
    }]);
  };

  const handleSendImage = (_base64: string) => handleBotNotice('Image upload is not connected yet in this MVP.');

  const handleSendVoice = (voiceText: string) => {
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'user',
      type: 'text',
      content: voiceText,
      timestamp: new Date(),
    }]);
    void processResponse({ voice_text: voiceText });
  };

  return (
    <div className={`${embedded ? 'h-full min-h-0 rounded-[28px] border border-border bg-background shadow-[0_24px_60px_rgba(7,45,50,0.08)] overflow-hidden' : 'h-screen'} flex flex-col bg-background`}>
      {/* Header */}
      <div className="bg-navy px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
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
        <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-teal/10 p-2 text-teal">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{ui.locationPrompt}</p>
              {locationStatus === 'ready' && (
                <p className="text-xs text-muted-foreground">{ui.locationReady}</p>
              )}
              {locationStatus === 'blocked' && (
                <p className="text-xs text-muted-foreground">{ui.locationBlocked}</p>
              )}
            </div>
            {locationStatus !== 'ready' && (
              <button
                type="button"
                onClick={requestLocation}
                className="rounded-full bg-teal px-3 py-1.5 text-xs font-medium text-accent-foreground transition hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={locationStatus === 'loading'}
              >
                {locationStatus === 'loading' ? '...' : ui.enableLocation}
              </button>
            )}
          </div>
        </div>

        {isAshaMode ? (
          <div className="mb-4">
            <AshaCaseForm onSubmitCase={handleSendText} disabled={isLoading} />
          </div>
        ) : (
          <div className="mb-4 md:hidden">
            <QuickSymptomButtons onSelect={handleSendText} language={language} />
          </div>
        )}

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
        onSendVoice={handleSendVoice}
        onVoiceUnavailable={() => handleBotNotice(ui.voiceUnavailable)}
        disabled={isLoading}
        enableVoice
        enableImage={false}
        language={language}
        placeholder={isAshaMode ? 'Describe the patient case or use the case form above...' : ui.placeholder}
        listeningLabel={`${ui.listening}...`}
      />
    </div>
  );
}
