import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { GRAU_RISCO_INSS, type GrauRiscoInss } from '@/lib/nr1Risco';
import { useNr1Subscription } from '@/hooks/useNr1';
import { useUpdateGrauRiscoInss } from '@/hooks/useNr1PlanosAcao';

export function GrauRiscoInssCard() {
  const { data: sub } = useNr1Subscription();
  const update = useUpdateGrauRiscoInss();
  const grau = (sub as any)?.grau_risco_inss as GrauRiscoInss | null | undefined;
  const info = grau ? GRAU_RISCO_INSS[grau] : null;
  const [editing, setEditing] = useState(false);

  return (
    <Card className={info ? info.bg : 'border-dashed'}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <ShieldAlert className={`h-5 w-5 ${info?.cor ?? 'text-muted-foreground'}`} />
            <div>
              <CardTitle className="text-base">Grau de Risco INSS (CNAE)</CardTitle>
              <CardDescription>
                Classificação oficial usada na GPS — define exigências mínimas da NR-1.
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {info && !editing && (
              <Badge className={info.bg + ' ' + info.cor + ' border'}>
                Grau {info.grau} · {info.label} · {info.rat}
              </Badge>
            )}
            <Button size="sm" variant="outline" onClick={() => setEditing((v) => !v)}>
              {editing ? 'Fechar' : grau ? 'Alterar' : 'Definir'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {editing && (
          <div className="flex items-center gap-2">
            <Select
              value={grau ? String(grau) : ''}
              onValueChange={(v) => update.mutate(Number(v) as GrauRiscoInss, { onSuccess: () => setEditing(false) })}
            >
              <SelectTrigger className="max-w-xs"><SelectValue placeholder="Selecione o grau (1–4)" /></SelectTrigger>
              <SelectContent>
                {([1, 2, 3, 4] as const).map((g) => (
                  <SelectItem key={g} value={String(g)}>
                    Grau {g} — {GRAU_RISCO_INSS[g].label} ({GRAU_RISCO_INSS[g].rat})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {!info ? (
          <p className="text-sm text-muted-foreground">
            Defina o grau de risco da empresa (consulte sua GPS ou CNAE preponderante) para
            visualizar as exigências e ações obrigatórias da NR-1.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Exemplos de atividade</p>
              <p className="text-sm">{info.exemplos}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Exigências NR-1</p>
              <ul className="space-y-1">
                {info.exigencias.map((e) => (
                  <li key={e} className="text-sm flex items-start gap-1.5">
                    <CheckCircle2 className={`h-3.5 w-3.5 mt-0.5 ${info.cor}`} />
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Ações obrigatórias</p>
              <ul className="grid gap-1 sm:grid-cols-2">
                {info.acoesObrigatorias.map((a) => (
                  <li key={a} className="text-sm flex items-start gap-1.5">
                    <CheckCircle2 className={`h-3.5 w-3.5 mt-0.5 ${info.cor}`} />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
