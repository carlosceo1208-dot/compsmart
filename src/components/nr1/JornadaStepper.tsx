import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const MOMENTOS = [
  { n: 1, label: 'Boas-vindas' },
  { n: 2, label: 'Consentimento' },
  { n: 3, label: 'Triagem rápida' },
  { n: 4, label: 'Feedback' },
  { n: 5, label: 'Diagnóstico' },
  { n: 6, label: 'Plano' },
  { n: 7, label: 'Identificação' },
  { n: 8, label: 'Acompanhamento' },
];

export function JornadaStepper({ momentoAtual }: { momentoAtual: number }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {MOMENTOS.map((m, i) => {
        const done = m.n < momentoAtual;
        const current = m.n === momentoAtual;
        return (
          <div key={m.n} className="flex items-center gap-1 shrink-0">
            <div
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition',
                done && 'bg-emerald-100 text-emerald-700',
                current && 'nr1-bg-primary text-white',
                !done && !current && 'bg-muted text-muted-foreground',
              )}
            >
              {done ? (
                <Check className="h-3 w-3" />
              ) : (
                <span className="h-4 w-4 rounded-full bg-white/30 text-[10px] flex items-center justify-center">
                  {m.n}
                </span>
              )}
              <span className="hidden md:inline">{m.label}</span>
            </div>
            {i < MOMENTOS.length - 1 && <div className="w-2 h-px bg-border" />}
          </div>
        );
      })}
    </div>
  );
}
