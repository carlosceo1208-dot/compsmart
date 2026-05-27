import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, AlertTriangle, FileText, Users, ShieldCheck, ArrowRight, GitCompare, History, Scale, Pencil, Trash2, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useNr1Diagnosticos, useNr1Subscription, useUpdateNr1Diagnostico, useDeleteNr1Diagnostico } from '@/hooks/useNr1';
import { RISCO_CLASS, RISCO_LABEL, DIMENSAO_LABEL, type Dimensao } from '@/lib/nr1';
import { GRAU_RISCO_INSS, type GrauRiscoInss } from '@/lib/nr1Risco';
import { Skeleton } from '@/components/ui/skeleton';
import { GrauRiscoInssCard } from '@/components/nr1/GrauRiscoInssCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

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

      {/* Ciclos & Comparação */}
      {ciclosConcluidos.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4 nr1-text-primary" />
                Ciclos de Diagnóstico ({ciclosConcluidos.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Acompanhe a evolução entre ciclos e compare resultados lado a lado.
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/nr1/diagnosticos">Ver histórico completo <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Lista compacta dos últimos ciclos */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ciclosConcluidos.slice(0, 6).map((c) => (
                <Link
                  key={c.id}
                  to={`/nr1/diagnostico/${c.id}`}
                  className="flex items-center justify-between gap-2 p-3 rounded-md border hover:bg-muted/50 transition"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.ciclo_nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.total_respondentes} resp · Score {c.score_geral?.toFixed(1) ?? '—'}
                    </p>
                  </div>
                  {c.nivel_risco && (
                    <Badge className={RISCO_CLASS[c.nivel_risco as keyof typeof RISCO_CLASS]}>
                      {RISCO_LABEL[c.nivel_risco as keyof typeof RISCO_LABEL]}
                    </Badge>
                  )}
                </Link>
              ))}
            </div>

            {/* Comparador */}
            {ciclosConcluidos.length >= 2 && (
              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 nr1-text-primary" />
                  <h4 className="text-sm font-semibold">Comparar ciclos</h4>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Select value={cicloAId} onValueChange={setCicloAId}>
                    <SelectTrigger><SelectValue placeholder="Ciclo A" /></SelectTrigger>
                    <SelectContent>
                      {ciclosConcluidos.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.ciclo_nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={cicloBId} onValueChange={setCicloBId}>
                    <SelectTrigger><SelectValue placeholder="Ciclo B" /></SelectTrigger>
                    <SelectContent>
                      {ciclosConcluidos.map((c) => (
                        <SelectItem key={c.id} value={c.id} disabled={c.id === cicloAId}>{c.ciclo_nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {cicloA && cicloB && (
                  <div className="rounded-md border overflow-hidden">
                    <div className="grid grid-cols-3 text-xs font-medium bg-muted/50 px-3 py-2">
                      <span>Métrica</span>
                      <span className="text-center">{cicloA.ciclo_nome}</span>
                      <span className="text-center">{cicloB.ciclo_nome}</span>
                    </div>
                    {[
                      { label: 'Score geral', a: cicloA.score_geral, b: cicloB.score_geral, fmt: (v: any) => v?.toFixed(1) ?? '—' },
                      { label: 'Respondentes', a: cicloA.total_respondentes, b: cicloB.total_respondentes, fmt: (v: any) => v ?? '—' },
                      { label: 'Nível de risco', a: cicloA.nivel_risco, b: cicloB.nivel_risco, fmt: (v: any) => v ? RISCO_LABEL[v as keyof typeof RISCO_LABEL] : '—' },
                    ].map((row) => {
                      const delta = typeof row.a === 'number' && typeof row.b === 'number' ? (row.b as number) - (row.a as number) : null;
                      return (
                        <div key={row.label} className="grid grid-cols-3 px-3 py-2 text-sm border-t items-center">
                          <span className="text-muted-foreground">{row.label}</span>
                          <span className="text-center tabular-nums">{row.fmt(row.a)}</span>
                          <span className="text-center tabular-nums">
                            {row.fmt(row.b)}
                            {delta !== null && delta !== 0 && (
                              <span className={`ml-1 text-xs ${delta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                ({delta > 0 ? '+' : ''}{delta.toFixed(1)})
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}

                    {/* Dimensões */}
                    {cicloA.scores_dimensao && cicloB.scores_dimensao && (
                      <>
                        <div className="px-3 py-2 text-xs font-medium bg-muted/30 border-t">Por dimensão</div>
                        {Array.from(new Set([
                          ...Object.keys(cicloA.scores_dimensao as object),
                          ...Object.keys(cicloB.scores_dimensao as object),
                        ])).map((dim) => {
                          const a = (cicloA.scores_dimensao as Record<string, number>)[dim];
                          const b = (cicloB.scores_dimensao as Record<string, number>)[dim];
                          const delta = typeof a === 'number' && typeof b === 'number' ? b - a : null;
                          return (
                            <div key={dim} className="grid grid-cols-3 px-3 py-2 text-sm border-t items-center">
                              <span className="text-muted-foreground truncate">{DIMENSAO_LABEL[dim as Dimensao] ?? dim}</span>
                              <span className="text-center tabular-nums">{typeof a === 'number' ? a.toFixed(1) : '—'}</span>
                              <span className="text-center tabular-nums">
                                {typeof b === 'number' ? b.toFixed(1) : '—'}
                                {delta !== null && delta !== 0 && (
                                  <span className={`ml-1 text-xs ${delta < 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    ({delta > 0 ? '+' : ''}{delta.toFixed(1)})
                                  </span>
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}
              </div>
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
