import { useState, useRef } from 'react';
import { Send, Mic, MicOff, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface InputBarProps {
  onSendText: (text: string) => void;
  onSendImage: (base64: string) => void;
  onSendVoice: (text: string) => void;
  disabled?: boolean;
}

export default function InputBar({ onSendText, onSendImage, onSendVoice, disabled }: InputBarProps) {
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!text.trim()) return;
    onSendText(text.trim());
    setText('');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        // In a real app, send audio to speech-to-text API
        onSendVoice('Voice message recorded (speech-to-text would process this)');
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      setRecordTime(0);
      timerRef.current = setInterval(() => setRecordTime(t => t + 1), 1000);
    } catch {
      console.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
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
        {recording && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center gap-3 mb-3 text-sm text-emergency"
          >
            <span className="w-2 h-2 rounded-full bg-emergency animate-pulse" />
            Recording... {recordTime}s
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2">
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

        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Describe your symptoms..."
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
