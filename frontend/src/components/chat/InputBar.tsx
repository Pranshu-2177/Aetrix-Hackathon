import { useRef, useState } from 'react';
import { Send, Mic, MicOff, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { SPEECH_LOCALES, type Language } from '@/lib/types';

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

interface BrowserSpeechRecognitionResult {
  0: {
    transcript: string;
  };
}

interface BrowserSpeechRecognitionEvent {
  results: ArrayLike<BrowserSpeechRecognitionResult>;
}

interface BrowserSpeechRecognitionErrorEvent {
  error?: string;
}

interface BrowserSpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface InputBarProps {
  onSendText: (text: string) => void;
  onSendImage: (base64: string) => void;
  onSendVoice: (text: string) => void;
  onVoiceUnavailable?: () => void;
  disabled?: boolean;
  enableVoice?: boolean;
  enableImage?: boolean;
  language: Language;
  placeholder: string;
  listeningLabel: string;
}

export default function InputBar({
  onSendText,
  onSendImage,
  onSendVoice,
  onVoiceUnavailable,
  disabled,
  enableVoice = true,
  enableImage = true,
  language,
  placeholder,
  listeningLabel,
}: InputBarProps) {
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!text.trim()) return;
    onSendText(text.trim());
    setText('');
  };

  const getSpeechRecognition = () => {
    if (typeof window === 'undefined') {
      return null;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    return Recognition ? new Recognition() : null;
  };

  const startRecording = () => {
    const recognition = getSpeechRecognition();
    if (!recognition) {
      onVoiceUnavailable?.();
      return;
    }

    recognition.lang = SPEECH_LOCALES[language];
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? '')
        .join(' ')
        .trim();

      if (transcript) {
        onSendVoice(transcript);
      }
    };
    recognition.onerror = () => {
      setRecording(false);
      onVoiceUnavailable?.();
    };
    recognition.onend = () => {
      setRecording(false);
    };

    recognitionRef.current = recognition;
    setRecording(true);
    recognition.start();
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      onSendImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="border-t border-border bg-card px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
      <AnimatePresence>
        {enableVoice && recording && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center gap-3 mb-3 text-sm text-emergency"
          >
            <span className="w-2 h-2 rounded-full bg-emergency animate-pulse" />
            {listeningLabel}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2">
        {enableImage && (
          <>
            <input type="file" ref={fileRef} accept="image/*" capture="environment" className="hidden" onChange={handleImage} />
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-navy-lighter hover:text-teal flex-shrink-0"
              onClick={() => fileRef.current?.click()}
              disabled={disabled}
              aria-label="Upload image"
            >
              <Camera className="w-5 h-5" />
            </Button>
          </>
        )}

        {enableVoice && (
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full flex-shrink-0 ${recording ? 'text-emergency' : 'text-navy-lighter hover:text-teal'}`}
            onClick={recording ? stopRecording : startRecording}
            disabled={disabled}
            aria-label={recording ? 'Stop recording' : 'Start recording'}
          >
            {recording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
        )}

        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-muted rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-teal transition-shadow"
        />

        <Button
          variant="cta"
          size="icon"
          className="rounded-full flex-shrink-0 w-10 h-10"
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
