import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip as UiTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Users, DollarSign, ShieldCheck, Info, Download, FileText, EyeOff } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { useNr1Intelligence, type UnitCrossInsight } from '@/hooks/useNr1Intelligence';
import { useClimaCopsoqCorrelacao } from '@/hooks/useClimaCopsoqCorrelacao';
import { DIMENSAO_LABEL, type Dimensao } from '@/lib/nr1';
import { notaSaude, seloSaude, NOTA_METODO } from '@/lib/nr1Selo';
import { exportToCSV } from '@/lib/csvExport';
import { ModuleGate } from '@/components/ModuleGate';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import Nr1ClimaCorrelacao from './Nr1ClimaCorrelacao';

const fmtBRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const fmtN = (n: number | null | undefined, d = 1) => (n == null ? '—' : Number(n).toLocaleString('pt-BR', { maximumFractionDigits: d, minimumFractionDigits: d }));
const ABAS = ['executiva', 'clima', 'talentos', 'custo'] as const;

function Selo({ saude }: { saude: number | null }) {
  const s = seloSaude(saude);
  if (!s) return <span className="text-muted-foreground">—</span>;
  return <Badge variant={s.variant}>{s.label} ({fmtN(saude)})</Badge>;
}

function Ocultos({ n }: { n: number }) {
  if (!n) return null;
  return (
    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
      <EyeOff className="h-3.5 w-3.5" /> {n} recorte(s) oculto(s) — menos de 5 pessoas.
    </p>
  );
}

function NotaRodape() {
  return (
    <p className="text-xs text-muted-foreground flex items-start gap-1">
      <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {NOTA_METODO}
    </p>
  );
}

export default function Nr1Inteligencia() {
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  const [startDate, setStartDate] = useState(oneYearAgo.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(today.toISOString().slice(0, 10));
  const [unitId, setUnitId] = useState<string>('all');
  const [params, setParams] = useSearchParams();
  const abaParam = params.get('aba');
  const aba = (ABAS as readonly string[]).includes(abaParam ?? '') ? (abaParam as string) : 'executiva';

  const access = useModuleAccess();
  const hasClima = access.hasModule('clima');
  const hasPot = access.hasModule('potencial-sucessao');
  const hasIns = access.hasModule('insight');

  const { data: correl = [] } = useClimaCopsoqCorrelacao(hasClima);
  const causasRaiz = correl.filter((r) => r.prioridade === 'causa_raiz');
  const { data, isLoading } = useNr1Intelligence({ startDate, endDate, unitId }, causasRaiz.length > 0);

  const radarData = useMemo(() => {
    const dims = data?.diagnostico?.dimensoes;
    if (!dims) return [];
    return Object.entries(dims).map(([d, risco]) => ({ dimensao: DIMENSAO_LABEL[d as Dimensao] ?? d, saude: notaSaude(Number(risco)) ?? 0 }));
  }, [data]);

  const units = data?.unitInsights ?? [];
  const periodo = `${startDate} a ${endDate}`;

  const exportarCSV = () => {
    exportToCSV<UnitCrossInsight>(`inteligencia-nr1-${endDate}`, [
      { header: 'Prioridade', accessor: (u) => units.indexOf(u) + 1 },
      { header: 'Unidade', accessor: (u) => u.unitName },
      { header: 'Pessoas', accessor: (u) => u.totalColab },
      { header: 'Nota de saúde', accessor: (u) => u.saude },
      { header: 'Selo', accessor: (u) => seloSaude(u.saude)?.label ?? '' },
      { header: 'Causa raiz confirmada', accessor: (u) => (u.causaRaiz ? 'Sim' : 'Não') },
      ...(data?.incluiPotencial ? [
        { header: 'Talentos críticos (9Box 1-3)', accessor: (u: UnitCrossInsight) => u.criticos9Box },
        { header: 'Estrelas (9Box 7-9)', accessor: (u: UnitCrossInsight) => u.estrelas9Box },
      ] : []),
      ...(data?.incluiRemuneracao ? [{ header: 'Salário médio', accessor: (u: UnitCrossInsight) => u.avgSalary }] : []),
      ...(data?.incluiPotencial && data?.incluiRemuneracao ? [{ header: 'Custo de turnover estimado', accessor: (u: UnitCrossInsight) => Math.round(u.custoTurnover) }] : []),
      { header: `Nota metodológica (período ${periodo}; ${data?.unidadesOcultas ?? 0} recorte(s) oculto(s) por ter menos de 5 pessoas; k=5)`, accessor: (u) => (units.indexOf(u) === 0 ? NOTA_METODO : '') },
    ], units);
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    // Fonte padrão do PDF não tem "−" nem "≥": troca por equivalentes legíveis.
    const t = (x: string) => x.replace(/−/g, '-').replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/×/g, 'x');
    const ocultas = data?.unidadesOcultas ?? 0;
    doc.setFontSize(16); doc.text('Inteligência NR-1 — relatório agregado', 14, 18);
    doc.setFontSize(9);
    doc.text(t(`Período: ${periodo} · Diagnóstico: ${data?.diagnostico?.nome ?? '—'} · Nota de saúde da empresa: ${fmtN(data?.saude)} (${seloSaude(data?.saude)?.label ?? '—'})`), 14, 26);
    doc.text(`${ocultas} recorte(s) oculto(s) por ter menos de 5 pessoas (k=5).`, 14, 30);
    doc.text(doc.splitTextToSize(t(`Nota metodológica: ${NOTA_METODO}`), 182), 14, 36);
    let y = 62;
    doc.setFontSize(10); doc.text('Prioridades por unidade (agregado, k=5)', 14, y); y += 6;
    doc.setFontSize(8);
    units.forEach((u, i) => {
      const parts = [`${i + 1}. ${u.unitName}`, `${u.totalColab} pessoas`, `selo ${seloSaude(u.saude)?.label ?? '—'}`];
      if (u.causaRaiz) parts.push('causa raiz confirmada');
      if (data?.incluiPotencial) parts.push(`estrelas ${u.estrelas9Box ?? 0}`, `críticos ${u.criticos9Box ?? 0}`);
      if (data?.incluiPotencial && data?.incluiRemuneracao) parts.push(`custo turnover ${fmtBRL(u.custoTurnover)}`);
      if (y > 280) { doc.addPage(); y = 18; }
      doc.text(t(parts.join(' · ')), 14, y); y += 5;
    });
    doc.save(`inteligencia-nr1-${endDate}.pdf`);
  };

  return (
    <TooltipProvider>
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Inteligência NR-1</h2>
          <p className="text-sm text-muted-foreground">Cruzamento do risco psicossocial com Clima, 9Box e Remuneração — sempre agregado.</p>
        </div>
        {data && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={exportarCSV}><Download className="h-4 w-4 mr-2" />Planilha</Button>
            <Button variant="outline" size="sm" onClick={exportarPDF}><FileText className="h-4 w-4 mr-2" />PDF</Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="pt-6 grid gap-4 md:grid-cols-4">
          <div><Label className="text-xs">Início do período</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
          <div><Label className="text-xs">Fim do período</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
          <div className="md:col-span-2">
            <Label className="text-xs">Unidade organizacional</Label>
            <Select value={unitId} onValueChange={setUnitId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as unidades</SelectItem>
                {(data?.allUnits ?? []).map((u) => <SelectItem key={u.unitId ?? 'none'} value={u.unitId ?? 'none'}>{u.unitName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs value={aba} onValueChange={(v) => setParams({ aba: v }, { replace: true })}>
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="executiva">Visão Executiva</TabsTrigger>
          <TabsTrigger value="clima">Clima × NR-1</TabsTrigger>
          <TabsTrigger value="talentos">Talentos em Risco</TabsTrigger>
          <TabsTrigger value="custo">Custo do Risco</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3 mt-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}</div>
        ) : !data?.diagnostico ? (
          <Card className="border-dashed mt-4">
            <CardContent className="pt-6 text-center space-y-3">
              <ShieldCheck className="h-10 w-10 mx-auto nr1-text-primary" />
              <h3 className="font-semibold">Nenhum diagnóstico NR-1 concluído no período</h3>
              <p className="text-sm text-muted-foreground">Para gerar inteligência cruzada, conclua ao menos um diagnóstico psicossocial.</p>
              <Button asChild className="nr1-bg-primary"><Link to="/nr1/diagnostico/novo">Iniciar diagnóstico</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <TabsContent value="executiva" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card><CardContent className="pt-6 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4" />Nota de saúde da empresa
                    <UiTooltip><TooltipTrigger aria-label="Como a nota é calculada"><Info className="h-3.5 w-3.5" /></TooltipTrigger>
                      <TooltipContent className="max-w-xs">Nota de saúde = 100 − risco psicossocial (COPSOQ-III). Risco {fmtN(data.diagnostico.risco, 2)}.</TooltipContent></UiTooltip>
                  </div>
                  <Selo saude={data.saude} />
                  <p className="text-xs text-muted-foreground">{data.diagnostico.nome}</p>
                </CardContent></Card>
                <Card><CardContent className="pt-6 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><AlertTriangle className="h-4 w-4" />Causas raiz (Clima × NR-1)</div>
                  {hasClima ? <p className="text-2xl font-semibold">{causasRaiz.length}</p> : <ModuleGate mode="inline" moduleSlug="clima" featureName="Clima Organizacional" />}
                </CardContent></Card>
                <Card><CardContent className="pt-6 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><DollarSign className="h-4 w-4" />Custo de turnover estimado</div>
                  {hasPot && hasIns ? <p className="text-2xl font-semibold">{fmtBRL(data.custoTotal)}</p> : <ModuleGate mode="inline" moduleSlugs={['potencial-sucessao', 'insight']} requireAll featureName="9Box e Remuneração" />}
                </CardContent></Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>O que resolver primeiro</CardTitle>
                  <CardDescription>Ordem fixa: causa raiz confirmada → Crítico com estrelas em risco → maior custo de turnover → mais colaboradores.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {units.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma unidade com 5 pessoas ou mais.</p>}
                  {units.map((u, i) => (
                    <div key={u.unitId ?? i} className="rounded-lg border p-3 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{i + 1}. <span className="break-words">{u.unitName}</span></span>
                        <Selo saude={u.saude} />
                        {u.causaRaiz && <Badge variant="destructive">Causa raiz confirmada</Badge>}
                        <span className="text-xs text-muted-foreground"><Users className="inline h-3 w-3" /> {u.totalColab}</span>
                      </div>
                      {u.alertas.map((a, j) => <p key={j} className="text-sm text-muted-foreground">• {a}</p>)}
                    </div>
                  ))}
                  <Ocultos n={data.unidadesOcultas} />
                </CardContent>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Saúde por dimensão</CardTitle><CardDescription>Último diagnóstico — nota de saúde (maior = melhor)</CardDescription></CardHeader>
                  <CardContent className="h-[300px]">
                    {radarData.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid /><PolarAngleAxis dataKey="dimensao" tick={{ fontSize: 10 }} /><PolarRadiusAxis angle={30} domain={[0, 100]} />
                          <Radar name="Saúde" dataKey="saude" stroke="hsl(var(--nr1-primary))" fill="hsl(var(--nr1-primary))" fillOpacity={0.3} /><Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    ) : <p className="text-sm text-muted-foreground text-center pt-12">Sem dados por dimensão.</p>}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Grupos autodeclarados</CardTitle><CardDescription>Check-up dos últimos 84 dias — só contagem e nota</CardDescription></CardHeader>
                  <CardContent className="space-y-2">
                    {data.grupos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum grupo com 5 pessoas ou mais.</p>}
                    {data.grupos.map((g) => (
                      <div key={g.grupo} className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                        <span className="break-words"><Badge variant="outline" className="mr-2">Grupo</Badge>{g.grupo}</span>
                        <span className="flex items-center gap-2 text-sm"><Users className="h-3 w-3" />{g.pessoas}<Selo saude={g.saude} /></span>
                      </div>
                    ))}
                    <Ocultos n={data.gruposOcultos} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="clima">
              <ModuleGate mode="section" moduleSlugs={['nr1', 'clima']} requireAll featureName="Correlação Clima × NR-1" description="Contrate o Clima Organizacional para cruzar a pesquisa de clima com os riscos psicossociais.">
                <Nr1ClimaCorrelacao />
              </ModuleGate>
            </TabsContent>

            <TabsContent value="talentos">
              <ModuleGate mode="section" moduleSlugs={['nr1', 'potencial-sucessao']} requireAll featureName="Talentos em Risco (NR-1 × 9Box)">
                <Card>
                  <CardHeader><CardTitle>Talentos em risco por unidade</CardTitle><CardDescription>Estrelas = 9Box 7–9 · Críticos = 9Box 1–3</CardDescription></CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow><TableHead>Unidade</TableHead><TableHead className="text-right">Pessoas</TableHead><TableHead className="text-right">Estrelas</TableHead><TableHead className="text-right">Críticos</TableHead><TableHead>Selo</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {units.map((u, i) => (
                          <TableRow key={u.unitId ?? i}><TableCell>{u.unitName}</TableCell><TableCell className="text-right">{u.totalColab}</TableCell><TableCell className="text-right">{u.estrelas9Box ?? '—'}</TableCell><TableCell className="text-right">{u.criticos9Box ?? '—'}</TableCell><TableCell><Selo saude={u.saude} /></TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <Ocultos n={data.unidadesOcultas} />
                  </CardContent>
                </Card>
              </ModuleGate>
            </TabsContent>

            <TabsContent value="custo">
              <ModuleGate mode="section" moduleSlugs={['nr1', 'potencial-sucessao', 'insight']} requireAll featureName="Custo do Risco (NR-1 × Remuneração)" ctaLabel="Ativar módulos necessários">
                <Card>
                  <CardHeader><CardTitle>Custo do risco por unidade</CardTitle><CardDescription>Estrelas em unidade Atenção/Crítico × salário médio anual (×13,33) × 0,5</CardDescription></CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow><TableHead>Unidade</TableHead><TableHead className="text-right">Salário médio</TableHead><TableHead className="text-right">Estrelas</TableHead><TableHead className="text-right">Custo estimado</TableHead><TableHead>Selo</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {units.map((u, i) => (
                          <TableRow key={u.unitId ?? i}><TableCell>{u.unitName}</TableCell><TableCell className="text-right">{u.avgSalary != null ? fmtBRL(u.avgSalary) : '—'}</TableCell><TableCell className="text-right">{u.estrelas9Box ?? '—'}</TableCell><TableCell className="text-right">{fmtBRL(u.custoTurnover)}</TableCell><TableCell><Selo saude={u.saude} /></TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <Ocultos n={data.unidadesOcultas} />
                  </CardContent>
                </Card>
              </ModuleGate>
            </TabsContent>

            <NotaRodape />
          </>
        )}
      </Tabs>
    </div>
    </TooltipProvider>
  );
}
