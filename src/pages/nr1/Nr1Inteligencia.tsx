import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { AlertTriangle, TrendingDown, Users, DollarSign, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNr1Intelligence } from '@/hooks/useNr1Intelligence';
import { RISCO_CLASS, RISCO_LABEL, DIMENSAO_LABEL, calcRisco, type Dimensao } from '@/lib/nr1';
import { ModuleGate } from '@/components/ModuleGate';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

const fmtBRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export default function Nr1Inteligencia() {
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  const [startDate, setStartDate] = useState(oneYearAgo.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(today.toISOString().slice(0, 10));
  const [unitId, setUnitId] = useState<string>('all');

  const moduleAccess = useModuleAccess();
  const hasCore = moduleAccess.hasModule('core');
  const hasInsight = moduleAccess.hasModule('insight');
  const hasPotential = moduleAccess.hasModule('potencial-sucessao');
  const hasCompensation = hasCore || hasInsight;
  const hasPerformance = hasCore;

  const { data, isLoading } = useNr1Intelligence(
    { startDate, endDate, unitId },
    { includePotential: hasPotential, includePerformance: hasPerformance, includeCompensation: hasCompensation },
  );

  const radarData = useMemo(() => {
    if (!data?.dimensoes) return [];
    return Object.entries(data.dimensoes).map(([dim, score]) => ({
      dimensao: DIMENSAO_LABEL[dim as Dimensao] ?? dim,
      score: Number(score),
    }));
  }, [data]);

  const boxBarData = useMemo(() => {
    if (!data) return [];
    return data.unitInsights.slice(0, 8).map((u) => ({
      unit: u.unitName.length > 14 ? u.unitName.slice(0, 12) + '…' : u.unitName,
      Críticos: u.criticos9Box,
      Estrelas: u.estrelas9Box,
    }));
  }, [data]);

  const riscoNivel = data?.riscoEmpresa != null ? calcRisco(data.riscoEmpresa) : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Inteligência: NR-1 × 9Box × Remuneração</h2>
        <p className="text-sm text-muted-foreground">
          Cruze risco psicossocial com performance e custo de talento para tomar decisões estratégicas.
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6 grid gap-4 md:grid-cols-4">
          <div>
            <Label className="text-xs">Início do período</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Fim do período</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">Unidade organizacional</Label>
            <Select value={unitId} onValueChange={setUnitId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as unidades</SelectItem>
                {data?.units.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[0,1,2,3].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : !data?.ultimo ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center space-y-3">
            <ShieldCheck className="h-10 w-10 mx-auto nr1-text-primary" />
            <h3 className="font-semibold">Nenhum diagnóstico NR-1 concluído no período</h3>
            <p className="text-sm text-muted-foreground">
              Para gerar inteligência cruzada, conclua ao menos um diagnóstico psicossocial.
            </p>
            <Button asChild className="nr1-bg-primary">
              <Link to="/nr1/diagnostico/novo">Iniciar diagnóstico</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-4">
            <KpiCard
              icon={ShieldCheck}
              label="Risco psicossocial"
              value={
                riscoNivel ? (
                  <Badge className={RISCO_CLASS[riscoNivel]}>
                    {RISCO_LABEL[riscoNivel]} ({data.riscoEmpresa?.toFixed(0)})
                  </Badge>
                ) : '—'
              }
            />
            <KpiCard
              icon={Users}
              label="Talentos analisados"
              value={
                <ModuleGate mode="inline" moduleSlug="potencial-sucessao" featureName="Avaliação de Potencial e Sucessão">
                  {`${data.kpis.totalColab}`}
                </ModuleGate>
              }
              hint={hasPotential ? `${data.kpis.totalEstrelas} estrelas · ${data.kpis.totalCriticos} críticos` : undefined}
            />
            <KpiCard
              icon={DollarSign}
              label="Salário médio"
              value={
                <ModuleGate mode="inline" moduleSlugs={["core", "insight"]} featureName="Remuneração & Equidade">
                  {fmtBRL(data.kpis.avgSalGeral || 0)}
                </ModuleGate>
              }
            />
            <KpiCard
              icon={TrendingDown}
              label="Custo turnover estimado"
              value={
                <ModuleGate
                  mode="inline"
                  moduleSlugs={["potencial-sucessao", "core", "insight"]}
                  allowIf={hasPotential && hasCompensation}
                  featureName="Risco × Potencial × Remuneração"
                  ctaLabel="Ativar módulos necessários"
                >
                  {fmtBRL(data.kpis.custoTurnoverEstimado)}
                </ModuleGate>
              }
              hint={hasPotential && hasCompensation ? 'Estrelas em ambiente de risco' : undefined}
              danger={hasPotential && hasCompensation && data.kpis.custoTurnoverEstimado > 0}
            />
          </div>

          {/* Insights acionáveis */}
          {data.unitInsights.flatMap((u) => u.alertas.map((a) => ({ unit: u.unitName, msg: a }))).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 nr1-text-primary" /> Insights acionáveis
                </CardTitle>
                <CardDescription>Recomendações geradas pelo cruzamento dos dados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.unitInsights.flatMap((u) =>
                  u.alertas.map((a, i) => (
                    <Alert key={`${u.unitId}-${i}`}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="text-sm">{u.unitName}</AlertTitle>
                      <AlertDescription className="text-sm">{a}</AlertDescription>
                    </Alert>
                  )),
                )}
              </CardContent>
            </Card>
          )}

          {/* Gráficos */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Risco por Dimensão (NR-1)</CardTitle>
                <CardDescription>Última avaliação psicossocial</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="dimensao" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="hsl(var(--nr1-primary))"
                        fill="hsl(var(--nr1-primary))"
                        fillOpacity={0.3}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center pt-12">Sem dados por dimensão.</p>
                )}
              </CardContent>
            </Card>

            <ModuleGate mode="section" moduleSlug="potencial-sucessao" featureName="Distribuição 9Box por Unidade">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição 9Box por Unidade</CardTitle>
                  <CardDescription>Talentos críticos vs estrelas</CardDescription>
                </CardHeader>
                <CardContent className="h-[320px]">
                  {boxBarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={boxBarData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="unit" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Críticos" fill="hsl(var(--destructive))" />
                        <Bar dataKey="Estrelas" fill="hsl(var(--nr1-primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center pt-12">
                      Sem dados de 9Box. Realize avaliações em <Link to="/performance/9box" className="underline">Performance · 9Box</Link>.
                    </p>
                  )}
                </CardContent>
              </Card>
            </ModuleGate>
          </div>

          {/* Tabela cruzada */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento por Unidade</CardTitle>
              <CardDescription>Cruzamento NR-1 × Performance × Remuneração</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Unidade</TableHead>
                    <TableHead className="text-right">Colab.</TableHead>
                    <TableHead className="text-right">Críticos 9Box</TableHead>
                    <TableHead className="text-right">Estrelas 9Box</TableHead>
                    <TableHead className="text-right">Perf. média</TableHead>
                    <TableHead className="text-right">Salário médio</TableHead>
                    <TableHead>Risco NR-1</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.unitInsights.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                        Nenhum colaborador encontrado com os filtros aplicados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.unitInsights.map((u) => (
                      <TableRow key={String(u.unitId)}>
                        <TableCell className="font-medium">{u.unitName}</TableCell>
                        <TableCell className="text-right tabular-nums">{u.totalColab}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {!hasPotential ? 'Bloqueado' : u.criticos9Box > 0 ? (
                            <Badge variant="destructive">{u.criticos9Box}</Badge>
                          ) : u.criticos9Box}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{hasPotential ? u.estrelas9Box : 'Bloqueado'}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {hasPerformance && u.avgPerformance != null ? u.avgPerformance.toFixed(2) : hasPerformance ? '—' : 'Bloqueado'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {hasCompensation && u.avgSalary != null ? fmtBRL(u.avgSalary) : hasCompensation ? '—' : 'Bloqueado'}
                        </TableCell>
                        <TableCell>
                          {riscoNivel ? (
                            <Badge className={RISCO_CLASS[riscoNivel]}>{RISCO_LABEL[riscoNivel]}</Badge>
                          ) : '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button variant="outline" asChild>
              <Link to="/talent-intelligence">
                Ir para Talent Intelligence <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({
  icon: Icon, label, value, hint, danger,
}: {
  icon: typeof Users;
  label: string;
  value: React.ReactNode;
  hint?: string;
  danger?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${danger ? 'bg-destructive/10' : 'nr1-bg-soft'}`}>
            <Icon className={`h-5 w-5 ${danger ? 'text-destructive' : 'nr1-text-primary'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <div className="text-lg font-semibold truncate">{value}</div>
            {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
