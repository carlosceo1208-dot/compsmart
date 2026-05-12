import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, AlertTriangle, FileText, Users, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNr1Diagnosticos, useNr1Subscription } from '@/hooks/useNr1';
import { RISCO_CLASS, RISCO_LABEL, DIMENSAO_LABEL, type Dimensao } from '@/lib/nr1';
import { Skeleton } from '@/components/ui/skeleton';

export default function Nr1Dashboard() {
  const { data: sub, isLoading: subLoading } = useNr1Subscription();
  const { data: diagnosticos, isLoading: diagLoading } = useNr1Diagnosticos();

  const ultimo = diagnosticos?.[0];
  const concluidos = diagnosticos?.filter((d) => d.status === 'concluido').length ?? 0;

  return (
    <div className="space-y-6">
      {/* Status da assinatura */}
      {subLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : !sub ? (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <h3 className="font-semibold">Sua empresa ainda não ativou o módulo NR-1</h3>
            <p className="text-sm text-muted-foreground">
              Conformidade legal, plano de ação e monitoramento de riscos psicossociais.
              Fale com o nosso time para conhecer as condições.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="nr1-bg-soft border-[hsl(var(--nr1-primary)/0.2)]">
          <CardContent className="pt-6 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 nr1-text-primary" />
              <div>
                <p className="font-semibold">
                  Plano {sub.plan_tier === 'pro' ? 'NR-1 Pro' : 'NR-1 Essencial'}
                </p>
                <p className="text-xs text-muted-foreground capitalize">Status: {sub.status}</p>
              </div>
            </div>
            <Badge variant="outline">Conformidade Ativa</Badge>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          icon={FileText}
          label="Diagnósticos realizados"
          value={diagLoading ? '—' : String(concluidos)}
        />
        <KpiCard
          icon={Users}
          label="Último ciclo"
          value={diagLoading ? '—' : ultimo ? `${ultimo.total_respondentes} respondentes` : 'Nenhum'}
        />
        <KpiCard
          icon={Activity}
          label="Nível de risco atual"
          value={
            ultimo?.nivel_risco ? (
              <Badge className={RISCO_CLASS[ultimo.nivel_risco as keyof typeof RISCO_CLASS]}>
                {RISCO_LABEL[ultimo.nivel_risco as keyof typeof RISCO_LABEL]}
              </Badge>
            ) : (
              '—'
            )
          }
        />
      </div>

      {/* Último diagnóstico */}
      {ultimo && ultimo.status === 'concluido' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Último Diagnóstico — {ultimo.ciclo_nome}</CardTitle>
              <CardDescription>
                Score geral: {ultimo.score_geral?.toFixed(1) ?? '—'}/100
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/nr1/diagnostico/${ultimo.id}`}>Ver relatório <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {ultimo.scores_dimensao && typeof ultimo.scores_dimensao === 'object' ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(ultimo.scores_dimensao as Record<string, number>).map(([dim, score]) => (
                  <div key={dim} className="flex items-center justify-between p-3 rounded-md border">
                    <span className="text-sm font-medium">
                      {DIMENSAO_LABEL[dim as Dimensao] ?? dim}
                    </span>
                    <span className="text-sm tabular-nums">{Number(score).toFixed(1)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sem dados por dimensão.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* CTA inicial se não houver diagnóstico */}
      {!diagLoading && (!diagnosticos || diagnosticos.length === 0) && (
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <AlertTriangle className="h-10 w-10 mx-auto nr1-text-primary" />
            <h3 className="font-semibold">Você ainda não realizou nenhum diagnóstico</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              O primeiro passo da NR-1 é mapear riscos psicossociais com um questionário científico aplicado aos colaboradores.
            </p>
            <Button asChild className="nr1-bg-primary">
              <Link to="/nr1/diagnostico/novo">Iniciar primeiro diagnóstico</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg nr1-bg-soft flex items-center justify-center">
            <Icon className="h-5 w-5 nr1-text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <div className="text-lg font-semibold">{value}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
