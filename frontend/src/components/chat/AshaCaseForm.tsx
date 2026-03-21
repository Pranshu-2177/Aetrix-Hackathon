import { useMemo, useState } from 'react';
import { ClipboardList } from 'lucide-react';

interface AshaCaseFormProps {
  disabled?: boolean;
  onSubmitCase: (text: string) => void;
}

const dangerOptions = [
  'Breathing trouble',
  'Chest pain',
  'Heavy bleeding',
  'Confusion',
  'Fainting',
];

export default function AshaCaseForm({ disabled, onSubmitCase }: AshaCaseFormProps) {
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [village, setVillage] = useState('');
  const [days, setDays] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [dangerSigns, setDangerSigns] = useState<string[]>([]);

  const summary = useMemo(() => {
    const parts = [
      age ? `Age ${age}` : '',
      sex,
      village ? `from ${village}` : '',
      days ? `sick for ${days} day${days === '1' ? '' : 's'}` : '',
      symptoms ? `symptoms: ${symptoms}` : '',
      dangerSigns.length ? `danger signs: ${dangerSigns.join(', ')}` : 'danger signs: none reported',
    ].filter(Boolean);

    return parts.join(', ');
  }, [age, sex, village, days, symptoms, dangerSigns]);

  const toggleDangerSign = (value: string) => {
    setDangerSigns((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  };

  const handleSubmit = () => {
    if (!symptoms.trim()) {
      return;
    }
    onSubmitCase(summary);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_12px_32px_rgba(7,45,50,0.05)]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal/10 text-teal">
          <ClipboardList className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">ASHA case entry</p>
          <p className="text-xs text-muted-foreground">Fill basic details, then send one patient summary.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input
          type="number"
          inputMode="numeric"
          min="0"
          placeholder="Age"
          value={age}
          onChange={(event) => setAge(event.target.value)}
          disabled={disabled}
          className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-teal"
        />
        <select
          value={sex}
          onChange={(event) => setSex(event.target.value)}
          disabled={disabled}
          className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-teal"
        >
          <option value="">Sex / patient type</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Pregnant woman">Pregnant woman</option>
          <option value="Child">Child</option>
          <option value="Elderly patient">Elderly patient</option>
        </select>
        <input
          type="text"
          placeholder="Village"
          value={village}
          onChange={(event) => setVillage(event.target.value)}
          disabled={disabled}
          className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-teal"
        />
        <input
          type="number"
          inputMode="numeric"
          min="0"
          placeholder="Days sick"
          value={days}
          onChange={(event) => setDays(event.target.value)}
          disabled={disabled}
          className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-teal"
        />
      </div>

      <textarea
        rows={3}
        placeholder="Main symptoms"
        value={symptoms}
        onChange={(event) => setSymptoms(event.target.value)}
        disabled={disabled}
        className="mt-3 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-teal"
      />

      <div className="mt-3">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Danger signs</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {dangerOptions.map((option) => {
            const active = dangerSigns.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleDangerSign(option)}
                disabled={disabled}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? 'border-emergency bg-emergency/10 text-emergency'
                    : 'border-border bg-background text-muted-foreground hover:border-teal/40 hover:text-foreground'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-muted/60 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Case summary</p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          {summary || 'Add symptoms to build the patient summary.'}
        </p>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={disabled || !symptoms.trim()}
        className="mt-4 rounded-full bg-teal px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Send case summary
      </button>
    </div>
  );
}
