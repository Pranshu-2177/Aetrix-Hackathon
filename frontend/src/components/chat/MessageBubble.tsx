import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import type { Message, TriageData, Hospital, PatientReport } from '@/lib/types';

function TriageBadge({ triage, confidence }: { triage: string; confidence: number }) {
  const config = {
    'self-care': { bg: 'bg-success-light', text: 'text-success', label: '✅ Self-Care' },
    clinic: { bg: 'bg-warning-light', text: 'text-warning', label: '🏥 Visit Clinic' },
    emergency: { bg: 'bg-emergency-light', text: 'text-emergency', label: '🚨 Emergency' },
  }[triage] || { bg: 'bg-muted', text: 'text-foreground', label: triage };

  return (
    <div className="flex items-center gap-3 mb-2">
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.bg} ${config.text}`}>{config.label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-teal rounded-full transition-all" style={{ width: `${confidence * 100}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{Math.round(confidence * 100)}%</span>
    </div>
  );
}

function HospitalCards({ hospitals }: { hospitals: Hospital[] }) {
  return (
    <div className="space-y-2 mt-2">
      {hospitals.map((h, i) => (
        <div key={i} className="bg-teal-lightest rounded-lg p-3 text-sm">
          <div className="flex justify-between items-start">
            <span className="font-semibold text-foreground">🏥 {h.name}</span>
            <span className="text-muted-foreground text-xs">{h.distance}</span>
          </div>
          <div className="text-muted-foreground text-xs mt-1">Contact: {h.contact}</div>
          <div className="flex gap-2 mt-2">
            <a href={`tel:${h.contact}`} className="text-xs px-3 py-1 rounded-full bg-teal text-accent-foreground font-medium">📞 Call</a>
            <a href={`https://www.google.com/maps?q=${h.lat},${h.lng}`} target="_blank" rel="noopener" className="text-xs px-3 py-1 rounded-full border border-teal text-teal font-medium">🗺️ Directions</a>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportCard({ report }: { report: PatientReport }) {
  return (
    <div className="bg-card border-l-4 border-teal rounded-xl p-4 mt-2">
      <h4 className="font-heading font-bold text-foreground text-sm mb-2">📋 Patient Summary Report</h4>
      <div className="text-sm space-y-2">
        <div><span className="font-medium text-foreground">Symptoms:</span>
          <ul className="list-disc ml-5 text-muted-foreground">{report.symptoms.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
        <div><span className="font-medium text-foreground">Triage:</span>{' '}
          <TriageBadge triage={report.triage} confidence={0.85} />
        </div>
        <p className="text-muted-foreground">{report.advice}</p>
        <p className="text-xs text-muted-foreground">Generated: {new Date(report.timestamp).toLocaleString()}</p>
      </div>
    </div>
  );
}

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-lg gradient-cta flex-shrink-0 flex items-center justify-center mt-1">
          <Shield className="w-3.5 h-3.5 text-accent-foreground" />
        </div>
      )}

      <div className={`max-w-[75%] md:max-w-[70%] ${isUser
        ? 'bg-teal text-accent-foreground rounded-tl-2xl rounded-bl-2xl rounded-br-2xl'
        : 'bg-card text-foreground rounded-tr-2xl rounded-br-2xl rounded-bl-2xl border border-border'
      } px-4 py-3`}>
        {message.imageUrl && (
          <img src={message.imageUrl} alt="Uploaded" className="w-full max-w-[200px] rounded-lg mb-2" />
        )}

        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

        {message.type === 'triage' && message.data && 'triage' in message.data && (
          <div className="mt-3">
            <TriageBadge triage={(message.data as TriageData).triage} confidence={(message.data as TriageData).confidence} />
            <p className="text-xs text-muted-foreground mt-1">{(message.data as TriageData).reason}</p>
          </div>
        )}

        {message.type === 'remedies' && message.data && 'remedies' in message.data && (
          <ul className="mt-2 space-y-1">
            {(message.data as TriageData).remedies.map((r, i) => (
              <li key={i} className="text-sm flex items-start gap-2"><span>💊</span>{r}</li>
            ))}
          </ul>
        )}

        {message.type === 'hospitals' && Array.isArray(message.data) && (
          <HospitalCards hospitals={message.data as Hospital[]} />
        )}

        {message.type === 'report' && message.data && 'symptoms' in message.data && (
          <ReportCard report={message.data as PatientReport} />
        )}

        <p className={`text-[10px] mt-1 ${isUser ? 'text-accent-foreground/60' : 'text-muted-foreground'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}
