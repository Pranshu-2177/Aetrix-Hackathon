import { motion } from 'framer-motion';
import { Building2, ExternalLink, MapPin, Phone, Star } from 'lucide-react';
import { UI_STRINGS, type FacilityInfo, type Language, type Message, type TriageData } from '@/lib/types';

function TriageBadge({
  triage,
  confidence,
  language,
}: {
  triage: string;
  confidence: number;
  language: Language;
}) {
  const ui = UI_STRINGS[language];
  const config = {
    'self-care': { bg: 'bg-success-light', text: 'text-success', label: `✅ ${ui.selfCareBadge}` },
    clinic: { bg: 'bg-warning-light', text: 'text-warning', label: `🏥 ${ui.clinicBadge}` },
    emergency: { bg: 'bg-emergency-light', text: 'text-emergency', label: `🚨 ${ui.emergencyBadge}` },
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

function formatFacilityType(facilityType: FacilityInfo['facility_type']) {
  if (facilityType === 'hospital') {
    return 'Hospital';
  }
  return 'Health centre';
}

function buildMapsLink(facility: FacilityInfo) {
  if (facility.maps_uri) {
    return facility.maps_uri;
  }
  const destination = `${facility.lat},${facility.lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const triageData = message.data as TriageData | undefined;
  const facilityData = message.data as FacilityInfo[] | undefined;
  const language = message.language ?? triageData?.language ?? 'en';
  const ui = UI_STRINGS[language];
  const showPrimaryText = message.type !== 'triage' || !triageData;

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <img src="/swasthai-logo-mark.svg" alt="SwasthAI" className="mt-1 h-7 w-7 flex-shrink-0 rounded-lg" />
      )}

      <div className={`max-w-[75%] md:max-w-[70%] ${isUser
        ? 'bg-teal text-accent-foreground rounded-tl-2xl rounded-bl-2xl rounded-br-2xl'
        : 'bg-card text-foreground rounded-tr-2xl rounded-br-2xl rounded-bl-2xl border border-border'
      } px-4 py-3`}>
        {message.imageUrl && (
          <img src={message.imageUrl} alt="Uploaded" className="w-full max-w-[200px] rounded-lg mb-2" />
        )}

        {showPrimaryText && <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>}

        {message.type === 'triage' && triageData && (
          <div className="mt-3">
            <TriageBadge triage={triageData.triage} confidence={triageData.confidence} language={language} />
            <p className="text-xs text-muted-foreground mt-1">{triageData.reason}</p>
            {triageData.recommendedActions[0] && (
              <div className="mt-2 rounded-lg bg-muted/60 px-3 py-2">
                <p className="text-xs font-medium text-foreground mb-1">{ui.immediateStep}</p>
                <p className="text-xs text-muted-foreground">{triageData.recommendedActions[0]}</p>
              </div>
            )}
          </div>
        )}

        {message.type === 'actions' && triageData && (
          <div className="mt-2">
            <ul className="space-y-1">
              {triageData.recommendedActions.map((action, i) => (
                <li key={i} className="text-sm flex items-start gap-2"><span>•</span>{action}</li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-3">{triageData.disclaimer}</p>
          </div>
        )}

        {message.type === 'facilities' && facilityData && (
          <div className="mt-2 space-y-3">
            {facilityData.map((facility) => (
              <div key={`${facility.name}-${facility.lat}-${facility.lng}`} className="rounded-xl border border-border bg-muted/30 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-teal" />
                      <p className="text-sm font-medium text-foreground">{facility.name}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{formatFacilityType(facility.facility_type)}</p>
                    {facility.formatted_address && (
                      <p className="mt-1 text-xs text-muted-foreground">{facility.formatted_address}</p>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {ui.distanceLabel}: {facility.distance_text}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                    {ui.ratingLabel}: {facility.rating.toFixed(1)}{facility.review_count ? ` (${facility.review_count})` : ''}
                  </span>
                  <a
                    href={buildMapsLink(facility)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-teal px-3 py-1.5 text-xs font-medium text-accent-foreground transition hover:bg-teal/90"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {ui.directionsLabel}
                  </a>
                  {facility.contact && (
                    <a href={`tel:${facility.contact}`} className="flex items-center gap-1 text-teal hover:underline">
                      <Phone className="h-3.5 w-3.5" />
                      {ui.callLabel}: {facility.contact}
                    </a>
                  )}
                </div>

                <div className="mt-3 rounded-lg bg-background/80 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{ui.whySuggestedLabel}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{facility.match_reason}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className={`text-[10px] mt-1 ${isUser ? 'text-accent-foreground/60' : 'text-muted-foreground'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}
