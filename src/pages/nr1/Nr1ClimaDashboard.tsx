import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ArrowLeft, AlertTriangle, TrendingUp, TrendingDown, Users, Smile, Frown, Meh, Radar as RadarIcon, LineChart as LineChartIcon, BarChart3, ChevronDown, MousePointerClick } from 'lucide-react';
import { DIMENSAO_LABEL, type ClimaDimensao, interpretarClima, QUESTOES } from '@/lib/climaQuestoes';
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, BarChart, Bar,
} from 'recharts';

type Pesquisa = {
  id: string; nome: string; status: string; periodo_inicio: string;
  total_respondentes: number; score_geral: number | null; scores_dimensao: Record<string, number> | null;
};
type Resposta = {
  id: string; pesquisa_id: string; departamento: string | null; funcao_nivel: string | null;
  tempo_empresa: string | null; modalidade_trabalho: string | null; tipo_respondente: string;
  score_geral: number | null; scores_dimensao: Record<string, number> | null; created_at: string;
};
type Item = { resposta_id: string; dimensao: ClimaDimensao; questao_num: number; valor: number };

type Segmento = 'departamento' | 'funcao_nivel' | 'tempo_empresa' | 'modalidade_trabalho';
const SEG_LABEL: Record<Segmento, string> = {
  departamento: 'Departamento',
  funcao_nivel: 'Função / Nível',
  tempo_empresa: 'Tempo de empresa',
  modalidade_trabalho: 'Modalidade de trabalho',
};

function corScore(score: number | null): string {
  if (score == null) return 'hsl(var(--muted))';
  if (score <= 2.0) return 'hsl(0 70% 50%)';
  if (score <= 3.0) return 'hsl(15 80% 55%)';
  if (score <= 3.5) return 'hsl(38 90% 55%)';
  if (score <= 4.2) return 'hsl(140 60% 50%)';
  return 'hsl(160 70% 40%)';
}

export default function Nr1ClimaDashboard() {
  const { activeCompanyId } = useCompanyContext();
  const { id: focusPesquisaId } = useParams<{ id: string }>();
  const [segmento, setSegmento] = useState<Segmento>('departamento');
  const [pesquisaSel, setPesquisaSel] = useState<string>(focusPesquisaId ?? 'all');
  const [comparePesquisaIds, setComparePesquisaIds] = useState<string[]>([]);
  const [drillDim, setDrillDim] = useState<ClimaDimensao | null>(null);

  const { data: pesquisas = [] } = useQuery({
    queryKey: ['clima-dash-pesquisas', activeCompanyId],
    enabled: !!activeCompanyId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('clima_pesquisas')
        .select('id,nome,status,periodo_inicio,total_respondentes,score_geral,scores_dimensao')
        .eq('company_id', activeCompanyId)
        .order('periodo_inicio', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Pesquisa[];
    },
  });

  const pesquisaAtual = pesquisaSel === 'all'
    ? pesquisas[pesquisas.length - 1]
    : pesquisas.find((p) => p.id === pesquisaSel);

  const { data: respostas = [] } = useQuery({
    queryKey: ['clima-dash-resp', activeCompanyId, pesquisaAtual?.id],
    enabled: !!activeCompanyId && !!pesquisaAtual,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('clima_respostas')
        .select('*')
        .eq('pesquisa_id', pesquisaAtual!.id);
      if (error) throw error;
      return (data ?? []) as Resposta[];
    },
  });

  const { data: itens = [] } = useQuery({
    queryKey: ['clima-dash-itens', pesquisaAtual?.id],
    enabled: !!pesquisaAtual && respostas.length > 0,
    queryFn: async () => {
      const ids = respostas.map((r) => r.id);
      const { data, error } = await (supabase as any)
        .from('clima_respostas_itens')
        .select('resposta_id,dimensao,questao_num,valor')
        .in('resposta_id', ids);
      if (error) throw error;
      return (data ?? []) as Item[];
    },
  });

  // Inicializa comparação com os últimos 3 ciclos quando carregam as pesquisas
  useEffect(() => {
    if (pesquisas.length > 0 && comparePesquisaIds.length === 0) {
      const ultimos = pesquisas.slice(-Math.min(3, pesquisas.length)).map((p) => p.id);
      setComparePesquisaIds(ultimos);
    }
  }, [pesquisas, comparePesquisaIds.length]);

  // Ciclo anterior (para o radar tradicional e drill-down)
  const pesquisaAnterior = useMemo(() => {
    if (!pesquisaAtual) return null;
    const idx = pesquisas.findIndex((p) => p.id === pesquisaAtual.id);
    return idx > 0 ? pesquisas[idx - 1] : null;
  }, [pesquisaAtual, pesquisas]);

  // Itens da pesquisa anterior — carregados sob demanda (apenas quando drill-down ativo)
  const { data: itensAnterior = [] } = useQuery({
    queryKey: ['clima-dash-itens-anterior', pesquisaAnterior?.id],
    enabled: !!drillDim && !!pesquisaAnterior,
    queryFn: async () => {
      const { data: resps, error: e1 } = await (supabase as any)
        .from('clima_respostas')
        .select('id')
        .eq('pesquisa_id', pesquisaAnterior!.id);
      if (e1) throw e1;
      const ids = (resps ?? []).map((r: any) => r.id);
      if (ids.length === 0) return [] as Item[];
      const { data, error } = await (supabase as any)
        .from('clima_respostas_itens')
        .select('resposta_id,dimensao,questao_num,valor')
        .in('resposta_id', ids);
      if (error) throw error;
      return (data ?? []) as Item[];
    },
  });



  const dimensoes = Object.keys(DIMENSAO_LABEL) as ClimaDimensao[];

  // Heatmap: segmento × dimensão
  const heatmap = useMemo(() => {
    const grupos = new Map<string, Resposta[]>();
    for (const r of respostas) {
      const key = (r[segmento] as string | null) || '(Não informado)';
      if (!grupos.has(key)) grupos.set(key, []);
      grupos.get(key)!.push(r);
    }
    const rows = Array.from(grupos.entries()).map(([seg, rs]) => {
      const cells: Record<ClimaDimensao, number | null> = {} as any;
      for (const dim of dimensoes) {
        const vals = rs.map((r) => r.scores_dimensao?.[dim]).filter((v): v is number => typeof v === 'number');
        cells[dim] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
      }
      const geralVals = rs.map((r) => r.score_geral).filter((v): v is number => typeof v === 'number');
      const geral = geralVals.length ? geralVals.reduce((a, b) => a + b, 0) / geralVals.length : null;
      return { segmento: seg, n: rs.length, cells, geral };
    });
    return rows.sort((a, b) => (b.geral ?? 0) - (a.geral ?? 0));
  }, [respostas, segmento]);

  // eNPS — proposito_alinhamento.6 "Sinto orgulho de trabalhar nesta organização"
  const enps = useMemo(() => {
    const orgulho = itens.filter((i) => i.dimensao === 'proposito_alinhamento' && i.questao_num === 6);
    if (!orgulho.length) return null;
    const promotores = orgulho.filter((i) => i.valor >= 5).length;
    const passivos = orgulho.filter((i) => i.valor === 4).length;
    const detratores = orgulho.filter((i) => i.valor <= 3).length;
    const total = orgulho.length;
    const score = Math.round(((promotores - detratores) / total) * 100);
    return { score, promotores, passivos, detratores, total };
  }, [itens]);

  const dimensoesCriticas = useMemo(() => {
    if (!pesquisaAtual?.scores_dimensao) return [];
    return dimensoes
      .map((d) => ({ d, s: pesquisaAtual.scores_dimensao?.[d] ?? null }))
      .filter((x) => x.s != null && (x.s as number) <= 3.0)
      .sort((a, b) => (a.s as number) - (b.s as number));
  }, [pesquisaAtual]);

  // Evolução temporal entre ciclos
  const evolucao = useMemo(() => {
    return pesquisas
      .filter((p) => p.score_geral != null)
      .map((p) => ({ nome: p.nome, data: p.periodo_inicio, score: p.score_geral!, n: p.total_respondentes }));
  }, [pesquisas]);

  // Radar: dimensões atuais vs ciclo anterior
  const radarData = useMemo(() => {
    if (!pesquisaAtual?.scores_dimensao) return [];
    const idx = pesquisas.findIndex((p) => p.id === pesquisaAtual.id);
    const anterior = idx > 0 ? pesquisas[idx - 1] : null;
    return dimensoes.map((d) => ({
      dim: DIMENSAO_LABEL[d].split(' ').slice(0, 2).join(' '),
      atual: Number((pesquisaAtual.scores_dimensao?.[d] ?? 0).toFixed(2)),
      anterior: anterior?.scores_dimensao?.[d] != null ? Number(anterior.scores_dimensao[d].toFixed(2)) : null,
    }));
  }, [pesquisaAtual, pesquisas]);

  // Evolução por dimensão entre ciclos
  const evolucaoDim = useMemo(() => {
    return pesquisas
      .filter((p) => p.scores_dimensao)
      .map((p) => {
        const row: any = { nome: p.nome.length > 14 ? p.nome.slice(0, 12) + '…' : p.nome };
        for (const d of dimensoes) {
          const v = p.scores_dimensao?.[d];
          if (typeof v === 'number') row[d] = Number(v.toFixed(2));
        }
        return row;
      });
  }, [pesquisas]);

  // Top/bottom segmentos por score geral
  const topBottom = useMemo(() => {
    const ranked = heatmap.filter((r) => r.geral != null);
    const top = ranked.slice(0, 5).map((r) => ({ nome: r.segmento, score: Number((r.geral as number).toFixed(2)), n: r.n }));
    const bottom = ranked.slice(-5).reverse().map((r) => ({ nome: r.segmento, score: Number((r.geral as number).toFixed(2)), n: r.n }));
    return { top, bottom };
  }, [heatmap]);

  // Pesquisas selecionadas para comparação multi-ciclos
  const pesquisasCompare = useMemo(
    () => pesquisas.filter((p) => comparePesquisaIds.includes(p.id)),
    [pesquisas, comparePesquisaIds],
  );

  // Radar multi-ciclos: cada eixo = dimensão, cada série = ciclo selecionado
  const radarMulti = useMemo(() => {
    return dimensoes.map((d) => {
      const row: any = {
        dim: DIMENSAO_LABEL[d].split(' ').slice(0, 2).join(' '),
        _dimKey: d,
      };
      for (const p of pesquisasCompare) {
        const v = p.scores_dimensao?.[d];
        if (typeof v === 'number') row[p.id] = Number(v.toFixed(2));
      }
      return row;
    });
  }, [pesquisasCompare]);

  // Evolução por dimensão filtrada pelos ciclos selecionados
  const evolucaoDimCompare = useMemo(() => {
    return pesquisasCompare
      .filter((p) => p.scores_dimensao)
      .map((p) => {
        const row: any = { nome: p.nome.length > 14 ? p.nome.slice(0, 12) + '…' : p.nome };
        for (const d of dimensoes) {
          const v = p.scores_dimensao?.[d];
          if (typeof v === 'number') row[d] = Number(v.toFixed(2));
        }
        return row;
      });
  }, [pesquisasCompare]);

  // Mapa label-curto → chave de dimensão (para resolver clique no radar)
  const dimByShortLabel = useMemo(() => {
    const m = new Map<string, ClimaDimensao>();
    for (const d of dimensoes) {
      m.set(DIMENSAO_LABEL[d].split(' ').slice(0, 2).join(' '), d);
    }
    return m;
  }, []);

  // Drill-down: agregação item-a-item da dimensão selecionada
  const drillData = useMemo(() => {
    if (!drillDim) return null;
    const questoesDim = QUESTOES.filter((q) => q.dimensao === drillDim);
    const atuais = itens.filter((i) => i.dimensao === drillDim);
    const anteriores = itensAnterior.filter((i) => i.dimensao === drillDim);
    const rows = questoesDim.map((q) => {
      const a = atuais.filter((i) => i.questao_num === q.num).map((i) => i.valor);
      const p = anteriores.filter((i) => i.questao_num === q.num).map((i) => i.valor);
      const avg = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
      const atual = avg(a);
      const anterior = avg(p);
      const delta = atual != null && anterior != null ? atual - anterior : null;
      return { num: q.num, texto: q.texto, atual, anterior, delta, nAtual: a.length, nAnterior: p.length };
    });
    // Ordena por menor score atual (itens mais impactantes vêm primeiro)
    rows.sort((x, y) => (x.atual ?? 999) - (y.atual ?? 999));
    return { rows, label: DIMENSAO_LABEL[drillDim] };
  }, [drillDim, itens, itensAnterior]);

  // Cor estável por id de pesquisa (consistente nos gráficos)
  function corPesquisa(pesquisaId: string): string {
    const idx = pesquisas.findIndex((p) => p.id === pesquisaId);
    const hue = (idx * 53) % 360;
    return `hsl(${hue} 65% 50%)`;
  }



  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/clima"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">Dashboard Analítico — Clima 360°</h1>
            <p className="text-xs text-muted-foreground">Heatmap, eNPS, evolução temporal e dimensões críticas.</p>
          </div>
        </div>
        <Select value={pesquisaSel} onValueChange={setPesquisaSel}>
          <SelectTrigger className="w-[260px]"><SelectValue placeholder="Selecionar ciclo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Último ciclo</SelectItem>
            {pesquisas.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!pesquisaAtual && (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Nenhum ciclo de clima disponível ainda.</CardContent></Card>
      )}

      {pesquisaAtual && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              icon={<Users className="h-4 w-4" />}
              label="Respondentes"
              value={String(pesquisaAtual.total_respondentes)}
              hint={`Ciclo ${new Date(pesquisaAtual.periodo_inicio).toLocaleDateString('pt-BR')}`}
            />
            <KpiCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Score Geral"
              value={pesquisaAtual.score_geral?.toFixed(2) ?? '—'}
              hint={interpretarClima(pesquisaAtual.score_geral).label}
              color={corScore(pesquisaAtual.score_geral)}
            />
            <KpiCard
              icon={enps && enps.score >= 0 ? <Smile className="h-4 w-4" /> : <Frown className="h-4 w-4" />}
              label="eNPS (orgulho)"
              value={enps ? (enps.score > 0 ? `+${enps.score}` : String(enps.score)) : '—'}
              hint={enps ? `${enps.promotores} prom · ${enps.detratores} detr` : 'sem dados'}
              color={enps ? (enps.score >= 30 ? 'hsl(160 70% 40%)' : enps.score >= 0 ? 'hsl(38 90% 55%)' : 'hsl(0 70% 50%)') : undefined}
            />
            <KpiCard
              icon={<AlertTriangle className="h-4 w-4" />}
              label="Dimensões críticas"
              value={String(dimensoesCriticas.length)}
              hint={dimensoesCriticas.length ? 'score ≤ 3.0' : 'nenhuma'}
              color={dimensoesCriticas.length ? 'hsl(0 70% 50%)' : 'hsl(160 70% 40%)'}
            />
          </div>

          {/* Dimensões críticas */}
          {dimensoesCriticas.length > 0 && (
            <Card className="border-[hsl(0_70%_50%/0.4)] bg-[hsl(0_70%_50%/0.04)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-[hsl(0_70%_45%)]">
                  <AlertTriangle className="h-4 w-4" /> Atenção: dimensões com score crítico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {dimensoesCriticas.map(({ d, s }) => (
                    <Badge key={d} variant="outline" className="border-[hsl(0_70%_50%)] text-[hsl(0_70%_45%)]">
                      {DIMENSAO_LABEL[d]} · {(s as number).toFixed(2)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Heatmap */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <div>
                <CardTitle className="text-base">Heatmap: dimensões × {SEG_LABEL[segmento].toLowerCase()}</CardTitle>
                <CardDescription className="text-xs">Verde = positivo · Amarelo = moderado · Vermelho = crítico</CardDescription>
              </div>
              <Select value={segmento} onValueChange={(v) => setSegmento(v as Segmento)}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SEG_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {heatmap.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Sem respostas suficientes para este recorte.</p>
              ) : (
                <table className="w-full text-xs border-collapse min-w-[800px]">
                  <thead>
                    <tr>
                      <th className="text-left p-2 sticky left-0 bg-background z-10 min-w-[180px]">
                        {SEG_LABEL[segmento]}
                      </th>
                      <th className="p-1 text-center w-10">n</th>
                      <th className="p-1 text-center w-14 font-semibold">Geral</th>
                      {dimensoes.map((d) => (
                        <th key={d} className="p-1 text-center w-16 font-medium" title={DIMENSAO_LABEL[d]}>
                          <div className="rotate-[-45deg] inline-block origin-center text-[10px] whitespace-nowrap leading-tight w-12">
                            {DIMENSAO_LABEL[d].split(' ').slice(0, 2).join(' ')}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmap.map((row) => (
                      <tr key={row.segmento} className="border-t">
                        <td className="p-2 sticky left-0 bg-background font-medium truncate max-w-[180px]" title={row.segmento}>
                          {row.segmento}
                        </td>
                        <td className="p-1 text-center text-muted-foreground">{row.n}</td>
                        <td className="p-1 text-center">
                          <ScoreCell score={row.geral} bold />
                        </td>
                        {dimensoes.map((d) => (
                          <td key={d} className="p-1 text-center">
                            <ScoreCell score={row.cells[d]} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* Evolução temporal */}
          {evolucao.length > 1 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Evolução entre ciclos</CardTitle>
                <CardDescription className="text-xs">Score geral por pesquisa ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {evolucao.map((e, idx) => {
                    const prev = idx > 0 ? evolucao[idx - 1].score : null;
                    const delta = prev != null ? e.score - prev : null;
                    return (
                      <div key={e.nome + e.data} className="flex items-center gap-3 text-sm">
                        <div className="w-32 text-xs text-muted-foreground">
                          {new Date(e.data).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                              <div className="h-full" style={{ width: `${(e.score / 5) * 100}%`, background: corScore(e.score) }} />
                            </div>
                            <div className="w-12 text-right font-mono font-semibold">{e.score.toFixed(2)}</div>
                            {delta != null && (
                              <div className={`w-14 text-right text-xs font-medium ${delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                                {delta > 0 ? '▲' : delta < 0 ? '▼' : '='} {Math.abs(delta).toFixed(2)}
                              </div>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">{e.nome} · {e.n} respondentes</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seletor de comparação multi-ciclos */}
          {pesquisas.length >= 2 && (
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between gap-3 flex-wrap">
                <div>
                  <CardTitle className="text-base">Comparação multi-ciclos</CardTitle>
                  <CardDescription className="text-xs">
                    Selecione 2 ou mais pesquisas para comparar a evolução agregada por dimensão.
                    Clique em uma dimensão (radar ou linha) para detalhar perguntas.
                  </CardDescription>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      {comparePesquisaIds.length} ciclo{comparePesquisaIds.length === 1 ? '' : 's'} selecionado{comparePesquisaIds.length === 1 ? '' : 's'}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-[300px] max-h-[360px] overflow-y-auto">
                    <p className="text-xs font-medium mb-2">Ciclos para comparar</p>
                    <div className="space-y-1.5">
                      {pesquisas.map((p) => {
                        const checked = comparePesquisaIds.includes(p.id);
                        return (
                          <label key={p.id} className="flex items-start gap-2 text-xs cursor-pointer hover:bg-muted/50 rounded p-1.5">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(v) => {
                                setComparePesquisaIds((prev) =>
                                  v ? [...prev, p.id] : prev.filter((x) => x !== p.id),
                                );
                              }}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{p.nome}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(p.periodo_inicio).toLocaleDateString('pt-BR')} · {p.total_respondentes} resp · score {p.score_geral?.toFixed(2) ?? '—'}
                              </p>
                            </div>
                            <span className="h-3 w-3 rounded-full mt-1" style={{ background: corPesquisa(p.id) }} />
                          </label>
                        );
                      })}
                    </div>
                    <div className="flex gap-2 mt-3 pt-2 border-t">
                      <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setComparePesquisaIds(pesquisas.slice(-3).map((p) => p.id))}>
                        Últimos 3
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setComparePesquisaIds(pesquisas.map((p) => p.id))}>
                        Todos
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setComparePesquisaIds([])}>
                        Limpar
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </CardHeader>
              <CardContent>
                {comparePesquisaIds.length < 2 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Selecione pelo menos 2 ciclos para visualizar a comparação.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {pesquisasCompare.map((p) => (
                      <Badge key={p.id} variant="outline" className="gap-1.5 text-xs">
                        <span className="h-2 w-2 rounded-full" style={{ background: corPesquisa(p.id) }} />
                        {p.nome} · {p.score_geral?.toFixed(2) ?? '—'}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Radar multi-ciclos */}
          {comparePesquisaIds.length >= 2 && radarMulti.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <RadarIcon className="h-4 w-4" /> Radar de Dimensões — Comparação entre ciclos
                </CardTitle>
                <CardDescription className="text-xs flex items-center gap-1">
                  <MousePointerClick className="h-3 w-3" /> Clique em uma dimensão para detalhar as perguntas que mais impactaram o score.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[380px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={radarMulti}
                      outerRadius="75%"
                      onClick={(state: any) => {
                        const label = state?.activeLabel;
                        if (label && dimByShortLabel.has(label)) setDrillDim(dimByShortLabel.get(label)!);
                      }}
                    >
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis
                        dataKey="dim"
                        tick={{ fontSize: 10, fill: 'hsl(var(--foreground))', cursor: 'pointer' }}
                      />
                      <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 9 }} />
                      {pesquisasCompare.map((p) => (
                        <Radar
                          key={p.id}
                          name={p.nome.length > 18 ? p.nome.slice(0, 16) + '…' : p.nome}
                          dataKey={p.id}
                          stroke={corPesquisa(p.id)}
                          fill={corPesquisa(p.id)}
                          fillOpacity={0.18}
                        />
                      ))}
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ fontSize: 11 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-muted-foreground self-center mr-1">Detalhar dimensão:</span>
                  {dimensoes.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDrillDim(d)}
                      className="text-[10px] px-2 py-0.5 rounded-full border border-border hover:bg-primary hover:text-primary-foreground transition"
                    >
                      {DIMENSAO_LABEL[d].split(' ').slice(0, 2).join(' ')}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Evolução por dimensão entre ciclos selecionados */}
          {comparePesquisaIds.length >= 2 && evolucaoDimCompare.length > 1 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <LineChartIcon className="h-4 w-4" /> Evolução por Dimensão — ciclos selecionados
                </CardTitle>
                <CardDescription className="text-xs flex items-center gap-1">
                  <MousePointerClick className="h-3 w-3" /> Clique em uma linha (ou na legenda) para abrir o drill-down da dimensão.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evolucaoDimCompare} margin={{ top: 6, right: 12, left: -16, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="nome" tick={{ fontSize: 10 }} />
                      <YAxis domain={[1, 5]} tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ fontSize: 11 }} />
                      <Legend
                        wrapperStyle={{ fontSize: 10, cursor: 'pointer' }}
                        onClick={(o: any) => {
                          const key = o?.dataKey as ClimaDimensao | undefined;
                          if (key && (DIMENSAO_LABEL as any)[key]) setDrillDim(key);
                        }}
                      />
                      {dimensoes.map((d, i) => (
                        <Line
                          key={d}
                          type="monotone"
                          dataKey={d}
                          name={DIMENSAO_LABEL[d].split(' ').slice(0, 2).join(' ')}
                          stroke={`hsl(${(i * 36) % 360} 65% 50%)`}
                          strokeWidth={1.8}
                          dot={{ r: 3, cursor: 'pointer' }}
                          activeDot={{ r: 5, cursor: 'pointer', onClick: () => setDrillDim(d) }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}


          {/* Top vs Bottom segmentos */}
          {(topBottom.top.length > 0 || topBottom.bottom.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-emerald-700"><BarChart3 className="h-4 w-4" /> Top 5 — {SEG_LABEL[segmento]}</CardTitle>
                  <CardDescription className="text-xs">Maiores scores gerais por {SEG_LABEL[segmento].toLowerCase()}.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topBottom.top} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 10 }} />
                        <YAxis type="category" dataKey="nome" tick={{ fontSize: 10 }} width={120} />
                        <Tooltip contentStyle={{ fontSize: 11 }} />
                        <Bar dataKey="score" fill="hsl(160 70% 40%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-orange-700"><BarChart3 className="h-4 w-4" /> Bottom 5 — {SEG_LABEL[segmento]}</CardTitle>
                  <CardDescription className="text-xs">Menores scores — prioridade de ação.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topBottom.bottom} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 10 }} />
                        <YAxis type="category" dataKey="nome" tick={{ fontSize: 10 }} width={120} />
                        <Tooltip contentStyle={{ fontSize: 11 }} />
                        <Bar dataKey="score" fill="hsl(0 70% 50%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {enps && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Meh className="h-4 w-4" /> eNPS — Orgulho de Pertencer
                </CardTitle>
                <CardDescription className="text-xs">
                  Baseado na questão: "Sinto orgulho de trabalhar nesta organização"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                    <p className="text-2xl font-bold text-emerald-700">{enps.promotores}</p>
                    <p className="text-xs text-emerald-600 mt-1">Promotores (5)</p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-2xl font-bold text-amber-700">{enps.passivos}</p>
                    <p className="text-xs text-amber-600 mt-1">Passivos (4)</p>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                    <p className="text-2xl font-bold text-orange-700">{enps.detratores}</p>
                    <p className="text-xs text-orange-600 mt-1">Detratores (≤3)</p>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-3 text-center">
                  Faixas: Excelente ≥ +50 · Bom +10 a +50 · Regular -10 a +10 · Crítico &lt; -10
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Drill-down: detalhe de dimensão (perguntas que mais impactaram o score) */}
      <Dialog open={!!drillDim} onOpenChange={(o) => !o && setDrillDim(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> {drillData?.label}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Perguntas da dimensão, do menor para o maior score atual. Use para identificar quais itens mais impactaram a média.
              {pesquisaAnterior && <> · Comparando <b>{pesquisaAtual?.nome}</b> com <b>{pesquisaAnterior.nome}</b>.</>}
            </DialogDescription>
          </DialogHeader>

          {drillData && (
            <div className="space-y-2">
              {drillData.rows.map((r) => (
                <div key={r.num} className="border rounded-md p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Pergunta {r.num}</p>
                      <p className="text-sm font-medium leading-snug">{r.texto}</p>
                    </div>
                    {r.delta != null && (
                      <Badge
                        variant="outline"
                        className={`shrink-0 gap-1 ${r.delta > 0 ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : r.delta < 0 ? 'border-orange-300 text-orange-700 bg-orange-50' : ''}`}
                      >
                        {r.delta > 0 ? <TrendingUp className="h-3 w-3" /> : r.delta < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                        {r.delta > 0 ? '+' : ''}{r.delta.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                        Atual · {pesquisaAtual?.nome} ({r.nAtual} resp)
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full" style={{ width: `${((r.atual ?? 0) / 5) * 100}%`, background: corScore(r.atual) }} />
                        </div>
                        <span className="font-mono text-sm font-semibold w-10 text-right">{r.atual?.toFixed(2) ?? '—'}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                        Anterior · {pesquisaAnterior?.nome ?? '—'} ({r.nAnterior} resp)
                      </p>
                      {r.anterior != null ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full opacity-60" style={{ width: `${(r.anterior / 5) * 100}%`, background: corScore(r.anterior) }} />
                          </div>
                          <span className="font-mono text-sm w-10 text-right text-muted-foreground">{r.anterior.toFixed(2)}</span>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Sem dados do ciclo anterior</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {drillData.rows.every((r) => r.atual == null) && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhuma resposta item-a-item disponível para esta dimensão no ciclo atual.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KpiCard({ icon, label, value, hint, color }: { icon: React.ReactNode; label: string; value: string; hint?: string; color?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span style={{ color: color ?? 'hsl(var(--muted-foreground))' }}>{icon}</span>
        </div>
        <p className="text-2xl font-bold" style={{ color: color ?? 'inherit' }}>{value}</p>
        {hint && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function ScoreCell({ score, bold }: { score: number | null; bold?: boolean }) {
  if (score == null) return <span className="text-muted-foreground">—</span>;
  return (
    <div
      className={`rounded px-1.5 py-1 text-white text-[11px] font-mono ${bold ? 'font-bold' : ''}`}
      style={{ background: corScore(score) }}
    >
      {score.toFixed(2)}
    </div>
  );
}
