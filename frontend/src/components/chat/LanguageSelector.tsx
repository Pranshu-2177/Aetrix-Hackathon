import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LANGUAGES, type Language } from '@/lib/types';

interface Props {
  value: Language;
  onChange: (lang: Language) => void;
}

export default function LanguageSelector({ value, onChange }: Props) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Language)}>
      <SelectTrigger className="w-[140px] bg-navy-light border-navy-lighter text-primary-foreground text-xs h-8">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map(lang => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.flag} {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
