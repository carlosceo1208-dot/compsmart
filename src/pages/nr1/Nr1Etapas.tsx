import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ETAPAS_PROGRAMA } from '@/lib/fib';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';

const status: Record<string, 'concluida' | 'em_andamento' | 'planejada'> = {
  preparacao: 'concluida',
  mensuracao: 'em_andamento',
  apreciacao: 'planejada',
  conscientizacao: 'planejada',
  transformacao: 'planejada',
};

const labelStatus = {
  concluida: { txt: 'Concluída', cls: 'bg-green-100 text-green-800' },
  em_andamento: { txt: 'Em andamento', cls: 'bg-blue-100 text-blue-800' },
  planejada: { txt: 'Planejada', cls: 'bg-muted text-muted-foreground' },
};

export default function Nr1Etapas() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Etapas do Programa</h2>
        <p className="text-sm text-muted-foreground">
          Ciclo de mensuração e transformação organizacional — da preparação à execução do plano de ação.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Linha do tempo</CardTitle>
          <CardDescription>Acompanhe o progresso do ciclo atual.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {ETAPAS_PROGRAMA.map((e, i) => {
              const st = status[e.key];
              const Icon = st === 'concluida' ? CheckCircle2 : Circle;
              return (
                <div key={e.key} className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-md border ${st === 'em_andamento' ? 'nr1-bg-soft border-[hsl(var(--nr1-primary)/0.4)]' : ''}`}>
                    <Icon className={`h-4 w-4 ${st === 'concluida' ? 'text-green-600' : st === 'em_andamento' ? 'nr1-text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">{e.label}</span>
                  </div>
                  {i < ETAPAS_PROGRAMA.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {ETAPAS_PROGRAMA.map((e, i) => {
          const st = status[e.key];
          const meta = labelStatus[st];
          return (
            <Card key={e.key}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Etapa {i + 1}</p>
                    <p className="font-semibold">{e.label}</p>
                  </div>
                  <Badge className={meta.cls}>{meta.txt}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{e.descricao}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
