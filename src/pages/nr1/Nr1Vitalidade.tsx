import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Download, FileText, Link2, Loader2, Lock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { exportToCSV } from '@/lib/csvExport';
import { exportDashboardToPDF } from '@/lib/pdfDashboardExport';
import { registrarAcessoNr1 } from '@/lib/nr1Privacy';
import { statusSegPsi } from '@/lib/nr1SegPsi';
import { VIT_DIMENSOES, VIT_DIM_LABEL, VIT_K_MINIMO, vitDimLabel } from '@/lib/nr1Vitalidade';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { ModuleGate } from '@/components/ModuleGate';

type Agregado = { total: number; score_geral: number | null; scores_dimensao: Record<string, number> | null };
type Resultado = {
  acesso: 'empresa' | 'gestor' | 'negado';
  motivo?: string;
  empresa?: (Agregado & { dados_suficientes: boolean; distribuicao?: Record<string, number> }) | null;
  grupos?: (Agregado & { grupo: string })[];
};
type Ciclo = { id: string; ciclo_nome: string; periodo_inicio: string; status: string };
type Historico = { ciclos?: { diagnostico_id: string; ciclo_nome: string; total: number; dados_suficientes: boolean; score_geral: number | null; scores_dimensao: Record<string, number> | null }[] };
type ExportLinha = { recorte: string; respondentes: number | null; dimensao: string; score: number | null; observacao?: string };

const FAIXAS = ['0-20', '20-40', '40-60', '60-80', '80-100'];
const NOTA_METODOLOGICA = 'Escala própria de Vitalidade (8 perguntas novas, com base em vigor/UWES e bem-estar/WHO-5, + 2 perguntas do diagnóstico COPSOQ usadas como referência, sem repetição no questionário), em 4 dimensões próprias: Energia, Recuperação, Equilíbrio e Satisfação. Não usa as 6 dimensões do COPSOQ. Resultados só agregados, com no mínimo 5 respostas por recorte.';
const rpc = supabase.rpc.bind(supabase) as unknown as (fn: string, args?: Record<string, unknown>) => Promise<{ data: any; error: any }>;

function StatusBadge({ score }: { score: number }) {
  const s = statusSegPsi(score);
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export default function Nr1Vitalidade() {
  const ref = useRef<HTMLDivElement>(null);
  const { activeCompanyId } = useCompanyContext();
  const { data: roleInfo } = useCurrentUserRole();
  const actorRole = roleInfo?.isSuperAdmin ? 'super_admin' : roleInfo?.isAdmin ? 'admin' : roleInfo?.isHR ? 'hr_manager' : roleInfo?.isConsultor ? 'consultor' : roleInfo?.isManager ? 'manager' : 'employee';
  const [cicloId, setCicloId] = useState<string>('');

  const ciclos = useQuery({
    queryKey: ['vitalidade-ciclos', activeCompanyId],
    enabled: !!activeCompanyId,
    queryFn: async () => { const { data, error } = await rpc('nr1_segpsi_ciclos'); if (error) throw error; return (data ?? []) as Ciclo[]; },
  });
  useEffect(() => { if (!cicloId && ciclos.data?.length) setCicloId(ciclos.data[0].id); }, [ciclos.data, cicloId]);

  const resultado = useQuery({
    queryKey: ['vitalidade-resultado', cicloId],
    enabled: !!cicloId,
    queryFn: async () => { const { data, error } = await rpc('nr1_vitalidade_resultado', { p_diagnostico_id: cicloId }); if (error) throw error; return data as Resultado; },
  });
  const escopoEmpresa = resultado.data?.acesso === 'empresa';
  const historico = useQuery({
    queryKey: ['vitalidade-historico', activeCompanyId],
    enabled: !!activeCompanyId && escopoEmpresa,
    queryFn: async () => { const { data, error } = await rpc('nr1_vitalidade_historico', { p_company_id: activeCompanyId }); if (error) throw error; return data as Historico; },
  });

  const cabecalho = (
    <div>
      <h2 className="text-xl font-semibold">Vitalidade</h2>
      <p className="text-sm text-muted-foreground">Energia, Recuperação, Equilíbrio e Satisfação. Somente agregados, com mínimo de {VIT_K_MINIMO} respostas.</p>
    </div>
  );

  if (ciclos.isLoading) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</div>;
  if (!ciclos.data?.length) {
    const gestorSemGrupo = actorRole === 'manager';
    return (
      <div className="space-y-6">
        {cabecalho}
        <Card><CardContent className="py-10 text-center space-y-2">
          <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="font-semibold">{gestorSemGrupo ? 'Seu acesso será liberado quando o RH vincular sua equipe a um grupo' : 'Dados insuficientes'}</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">{gestorSemGrupo ? 'Para preservar o anonimato, gestores acessam somente resultados agregados dos grupos vinculados pelo RH.' : 'Ainda não há ciclo do diagnóstico NR-1 com respostas de Vitalidade. As perguntas fazem parte do questionário anônimo do diagnóstico.'}</p>
        </CardContent></Card>
      </div>
    );
  }

  const r = resultado.data;
  const emp = r?.empresa;
  const grupos = r?.grupos ?? [];
  const dimsData = VIT_DIMENSOES.map((d) => ({ key: d, label: VIT_DIM_LABEL[d], score: emp?.scores_dimensao?.[d] ?? null }));
  const comDado = dimsData.filter((d) => d.score != null) as { key: string; label: string; score: number }[];
  const fragil = [...comDado].sort((a, b) => a.score - b.score)[0];
  const alertas = grupos.filter((g) => g.score_geral != null && statusSegPsi(g.score_geral).key !== 'saudavel');
  const histData = (historico.data?.ciclos ?? []).filter((c) => c.dados_suficientes).map((c) => ({ ciclo: c.ciclo_nome, score: Number(c.score_geral) }));
  const cicloNome = ciclos.data.find((c) => c.id === cicloId)?.ciclo_nome ?? '';
  const temAgregado = !!emp?.dados_suficientes || grupos.length > 0;

  const exportarCSV = () => {
    if (activeCompanyId) registrarAcessoNr1({ companyId: activeCompanyId, actorRole, action: 'export_csv', resource: 'vitalidade', kValue: VIT_K_MINIMO });
    const linhas: ExportLinha[] = [];
    if (emp?.dados_suficientes) {
      linhas.push({ recorte: 'Empresa', respondentes: emp.total, dimensao: 'Geral', score: Number(emp.score_geral) });
      comDado.forEach((d) => linhas.push({ recorte: 'Empresa', respondentes: emp.total, dimensao: d.label, score: d.score }));
      FAIXAS.forEach((f) => linhas.push({ recorte: 'Distribuição', respondentes: emp.distribuicao?.[f] ?? 0, dimensao: `Faixa ${f}`, score: null }));
    }
    grupos.forEach((g) => {
      linhas.push({ recorte: `Grupo: ${g.grupo}`, respondentes: g.total, dimensao: 'Geral', score: Number(g.score_geral) });
      Object.entries(g.scores_dimensao ?? {}).forEach(([d, v]) => linhas.push({ recorte: `Grupo: ${g.grupo}`, respondentes: g.total, dimensao: vitDimLabel(d), score: v }));
    });
    (historico.data?.ciclos ?? []).filter((c) => c.dados_suficientes).forEach((c) => linhas.push({ recorte: `Tendência: ${c.ciclo_nome}`, respondentes: c.total, dimensao: 'Geral', score: Number(c.score_geral) }));
    if (!linhas.length) linhas.push({ recorte: 'Dados insuficientes', respondentes: emp?.total ?? 0, dimensao: '—', score: null, observacao: `Mínimo de ${VIT_K_MINIMO} respostas não atingido` });
    linhas.push({ recorte: 'Nota metodológica', respondentes: null, dimensao: '—', score: null, observacao: NOTA_METODOLOGICA });
    exportToCSV('vitalidade_agregado', [
      { header: 'Recorte', accessor: (x: any) => x.recorte },
      { header: 'Respondentes', accessor: (x: any) => x.respondentes },
      { header: 'Dimensão', accessor: (x: any) => x.dimensao },
      { header: 'Score (0-100)', accessor: (x: any) => x.score },
      { header: 'Status', accessor: (x: ExportLinha) => x.score == null ? '' : statusSegPsi(x.score).label },
      { header: 'Observação', accessor: (x: ExportLinha) => x.observacao ?? '' },
    ], linhas);
  };
  const exportarPDF = async () => {
    if (activeCompanyId) registrarAcessoNr1({ companyId: activeCompanyId, actorRole, action: 'export_pdf', resource: 'vitalidade', kValue: VIT_K_MINIMO });
    if (ref.current) await exportDashboardToPDF(ref.current, { filename: 'vitalidade', title: 'Vitalidade — Relatório agregado', subtitle: `${cicloNome} · mínimo de ${VIT_K_MINIMO} respostas por recorte` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {cabecalho}
        <div className="flex flex-wrap gap-2">
          <Select value={cicloId} onValueChange={setCicloId}>
            <SelectTrigger className="w-full sm:w-[220px]"><SelectValue placeholder="Ciclo" /></SelectTrigger>
            <SelectContent>{ciclos.data.map((c) => <SelectItem key={c.id} value={c.id}>{c.ciclo_nome}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportarCSV} disabled={r?.acesso !== 'empresa' && !temAgregado}><Download className="h-4 w-4 mr-2" />Planilha</Button>
          <Button variant="outline" size="sm" onClick={exportarPDF} disabled={r?.acesso !== 'empresa' && !temAgregado}><FileText className="h-4 w-4 mr-2" />PDF</Button>
        </div>
      </div>

      {resultado.isLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando resultado…</div>}
      {r?.acesso === 'negado' && <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">{r.motivo ?? 'Acesso negado.'}</CardContent></Card>}

      {r && r.acesso !== 'negado' && (
        <div ref={ref} className="space-y-6 bg-background p-1">
          <p className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground"><strong>Nota metodológica:</strong> {NOTA_METODOLOGICA}</p>
          {escopoEmpresa && (
            emp?.dados_suficientes ? (
              <>
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                  <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Respondentes</p><p className="text-2xl font-semibold">{emp.total}</p></CardContent></Card>
                  <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Score global</p><p className="text-2xl font-semibold tabular-nums">{Number(emp.score_geral).toFixed(1)}</p></CardContent></Card>
                  <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Status</p><div className="mt-1"><StatusBadge score={Number(emp.score_geral)} /></div></CardContent></Card>
                  <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Dimensão mais frágil</p><p className="text-sm font-semibold mt-1">{fragil?.label ?? '—'}</p></CardContent></Card>
                </div>
                <Card>
                  <CardHeader><CardTitle>Score por dimensão</CardTitle><CardDescription>0–100; quanto maior, mais vitalidade.</CardDescription></CardHeader>
                  <CardContent className="grid gap-2 md:grid-cols-2">
                    {dimsData.map((d) => (
                      <div key={d.key} className="rounded-md border p-3">
                        <div className="flex items-start justify-between gap-2"><p className="text-sm font-medium">{d.label}</p>{d.score != null && <StatusBadge score={d.score} />}</div>
                        {d.score != null && <><Progress value={d.score} className="mt-2 h-2" /><p className="mt-1 text-xs text-muted-foreground tabular-nums">{d.score.toFixed(1)} / 100</p></>}
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Distribuição das respostas</CardTitle><CardDescription>Quantidade de respondentes por faixa de score.</CardDescription></CardHeader>
                  <CardContent><div className="h-[220px]"><ResponsiveContainer width="100%" height="100%">
                    <BarChart data={FAIXAS.map((f) => ({ faixa: f, n: emp.distribuicao?.[f] ?? 0 }))}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="faixa" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="n" name="Respondentes" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} /></BarChart>
                  </ResponsiveContainer></div></CardContent>
                </Card>
              </>
            ) : (
              <Card><CardContent className="py-8 text-center text-sm text-muted-foreground"><p className="font-semibold text-foreground">Dados insuficientes</p>Este ciclo tem {emp?.total ?? 0} de no mínimo {VIT_K_MINIMO} respostas. Os resultados aparecem quando o mínimo for atingido.</CardContent></Card>
            )
          )}

          <Card>
            <CardHeader><CardTitle>{escopoEmpresa ? 'Resultado por grupo' : 'Seus grupos'}</CardTitle><CardDescription>Só aparecem grupos com no mínimo {VIT_K_MINIMO} respostas. Os vínculos de gestor são os mesmos da Segurança Psicológica.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {alertas.length > 0 && (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
                  <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4 text-destructive" />Alertas por grupo</p>
                  <ul className="mt-1 space-y-0.5">{alertas.map((g) => <li key={g.grupo}>{g.grupo}: {statusSegPsi(Number(g.score_geral)).label} ({Number(g.score_geral).toFixed(1)})</li>)}</ul>
                </div>
              )}
              {grupos.length === 0 ? <p className="text-sm text-muted-foreground">Dados insuficientes: nenhum grupo atingiu o mínimo de respostas.</p> : (
                <div className="grid gap-2 md:grid-cols-2">{grupos.map((g) => (
                  <div key={g.grupo} className="rounded-md border p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0"><p className="truncate text-sm font-medium">{g.grupo}</p><p className="text-xs text-muted-foreground">{g.total} respondentes</p></div>
                      <div className="flex items-center gap-2"><span className="font-semibold tabular-nums">{Number(g.score_geral).toFixed(1)}</span><StatusBadge score={Number(g.score_geral)} /></div>
                    </div>
                    <ul className="grid grid-cols-2 gap-x-3 text-xs">{VIT_DIMENSOES.map((d) => <li key={d} className="flex justify-between"><span className="text-muted-foreground">{VIT_DIM_LABEL[d]}</span><span className="tabular-nums">{g.scores_dimensao?.[d]?.toFixed(1) ?? '—'}</span></li>)}</ul>
                  </div>
                ))}</div>
              )}
            </CardContent>
          </Card>

          {escopoEmpresa && (
            <Card>
              <CardHeader><CardTitle>Tendência entre ciclos</CardTitle><CardDescription>Score global por ciclo (só ciclos com o mínimo de respostas).</CardDescription></CardHeader>
              <CardContent>{histData.length < 2 ? <p className="text-sm text-muted-foreground">É preciso pelo menos 2 ciclos com o mínimo de respostas para mostrar a tendência.</p> : (
                <div className="h-[220px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={histData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="ciclo" /><YAxis domain={[0, 100]} /><Tooltip /><Line type="monotone" dataKey="score" name="Score" stroke="hsl(var(--primary))" strokeWidth={2} /></LineChart></ResponsiveContainer></div>
              )}</CardContent>
            </Card>
          )}
        </div>
      )}

      {escopoEmpresa && (
        <ModuleGate moduleSlug="clima" mode="section" featureName="Correlação com o Clima Organizacional" description="Cruze Vitalidade, eNPS e engajamento. Disponível para empresas com o Clima Organizacional contratado.">
          <Card><CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="font-semibold">Correlação com o Clima Organizacional</p><p className="text-sm text-muted-foreground">Compare a Vitalidade com o eNPS e o engajamento do Clima.</p></div>
            <Button asChild variant="outline" size="sm"><Link to="/clima/correlacao"><Link2 className="h-4 w-4 mr-2" />Abrir correlação</Link></Button>
          </CardContent></Card>
        </ModuleGate>
      )}
    </div>
  );
}
