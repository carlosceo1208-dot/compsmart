import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, AlertTriangle, FileText, Users, ShieldCheck, ArrowRight, GitCompare, History, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useNr1Diagnosticos, useNr1Subscription } from '@/hooks/useNr1';
import { RISCO_CLASS, RISCO_LABEL, DIMENSAO_LABEL, type Dimensao } from '@/lib/nr1';
import { GRAU_RISCO_INSS, type GrauRiscoInss } from '@/lib/nr1Risco';
import { Skeleton } from '@/components/ui/skeleton';
import { GrauRiscoInssCard } from '@/components/nr1/GrauRiscoInssCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useClimaCopsoqCorrelacao } from '@/hooks/useClimaCopsoqCorrelacao';
import { DIMENSAO_LABEL as CLIMA_LABEL, type ClimaDimensao } from '@/lib/climaQuestoes';

export default function Nr1Dashboard() {
  const { data: sub, isLoading: subLoading } = useNr1Subscription();
  const { data: diagnosticos, isLoading: diagLoading } = useNr1Diagnosticos();
  const { data: correlacoes = [] } = useClimaCopsoqCorrelacao();

  const ciclosConcluidos = useMemo(
    () => (diagnosticos ?? []).filter((d) => d.status === 'concluido'),
    [diagnosticos]
  );
  const [cicloAId, setCicloAId] = useState<string>('');
  const [cicloBId, setCicloBId] = useState<string>('');
  const cicloA = ciclosConcluidos.find((c) => c.id === cicloAId);
  const cicloB = ciclosConcluidos.find((c) => c.id === cicloBId);

  const topCorrelacoes = [...correlacoes]
    .filter((c) => c.prioridade === 'causa_raiz' || c.prioridade === 'atencao')
    .sort((a, b) => (a.prioridade === 'causa_raiz' ? -1 : 1) - (b.prioridade === 'causa_raiz' ? -1 : 1))
    .slice(0, 3);

  const ultimo = diagnosticos?.[0];
  const concluidos = diagnosticos?.filter((d) => d.status === 'concluido').length ?? 0;
  const grau = (sub as any)?.grau_risco_inss as GrauRiscoInss | null | undefined;
  const grauInfo = grau ? GRAU_RISCO_INSS[grau] : null;

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
            <div className="flex items-center gap-2">
              <Badge variant="outline">Conformidade Ativa</Badge>
              <Button asChild size="sm" className="nr1-bg-primary">
                <Link to="/nr1/fib">Abrir Matriz de Risco <ArrowRight className="h-4 w-4 ml-1" /></Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grau de Risco INSS + Plano de Ação */}
      <GrauRiscoInssCard />

      {/* Correlações de Risco Clima × COPSOQ */}
      {topCorrelacoes.length > 0 && (
        <Card className="border-[hsl(var(--nr1-primary)/0.3)]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <GitCompare className="h-4 w-4 nr1-text-primary" />
                  Correlações de Risco — Clima × COPSOQ
                </CardTitle>
                <CardDescription className="text-xs">
                  Top {topCorrelacoes.length} dimensões com convergência crítica entre os dois instrumentos.
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/nr1/clima/correlacao">Ver análise completa <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {topCorrelacoes.map((c, i) => (
                <li key={`${c.clima_dim}-${i}`} className="flex items-center justify-between gap-3 p-2 rounded-md border bg-card">
                  <div className="flex items-center gap-2 min-w-0">
                    {c.prioridade === 'causa_raiz' ? (
                      <Badge className="bg-red-100 text-red-700 border-red-300">Causa raiz</Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-400 text-amber-700">Atenção</Badge>
                    )}
                    <span className="text-sm font-medium truncate">
                      {CLIMA_LABEL[c.clima_dim as ClimaDimensao] ?? c.clima_dim}
                    </span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">↔ {DIMENSAO_LABEL[c.copsoq_dim as Dimensao] ?? c.copsoq_dim}</span>
                  </div>
                  <div className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                    Clima {c.clima_score?.toFixed(1) ?? '—'}/5 · COPSOQ {c.copsoq_score_raw?.toFixed(0) ?? '—'}/100
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}







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
            grauInfo ? (
              <Badge className={`${grauInfo.bg} ${grauInfo.cor} border`}>
                Grau {grauInfo.grau} · {grauInfo.label}
              </Badge>
            ) : ultimo?.nivel_risco ? (
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
