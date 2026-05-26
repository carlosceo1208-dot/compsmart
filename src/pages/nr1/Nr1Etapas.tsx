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

// Paleta semântica por etapa (HSL)
const etapaCores: Record<string, { main: string; soft: string; border: string }> = {
  preparacao:     { main: '217 91% 60%', soft: '217 91% 60% / 0.12', border: '217 91% 60% / 0.5' },
  mensuracao:     { main: '173 80% 40%', soft: '173 80% 40% / 0.12', border: '173 80% 40% / 0.5' },
  apreciacao:     { main: '38 92% 50%',  soft: '38 92% 50% / 0.15',  border: '38 92% 50% / 0.5'  },
  conscientizacao:{ main: '262 83% 58%', soft: '262 83% 58% / 0.12', border: '262 83% 58% / 0.5' },
  transformacao:  { main: '160 84% 39%', soft: '160 84% 39% / 0.12', border: '160 84% 39% / 0.5' },
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
              const cor = etapaCores[e.key];
              const isPlanejada = st === 'planejada';
              return (
                <div key={e.key} className="flex items-center gap-2">
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-md border transition"
                    style={{
                      backgroundColor: `hsl(${cor.soft})`,
                      borderColor: `hsl(${cor.border})`,
                      opacity: isPlanejada ? 0.6 : 1,
                      boxShadow: st === 'em_andamento' ? `0 0 0 2px hsl(${cor.main} / 0.25)` : undefined,
                    }}
                  >
                    <Icon
                      className="h-4 w-4"
                      style={{ color: `hsl(${cor.main})` }}
                    />
                    <span className="text-sm font-medium" style={{ color: `hsl(${cor.main})` }}>
                      {e.label}
                    </span>
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
          const cor = etapaCores[e.key];
          return (
            <Card
              key={e.key}
              className="overflow-hidden border-l-4"
              style={{ borderLeftColor: `hsl(${cor.main})` }}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className="inline-block text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded mb-1"
                      style={{
                        backgroundColor: `hsl(${cor.soft})`,
                        color: `hsl(${cor.main})`,
                      }}
                    >
                      Etapa {i + 1}
                    </span>
                    <p className="font-semibold" style={{ color: `hsl(${cor.main})` }}>
                      {e.label}
                    </p>
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
