// Relatórios Executivos — Pesquisa de Clima 360° (Item 5)
// Consolida clima + COPSOQ + clima externo em PDF executivo e CSVs.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ArrowLeft, FileText, FileSpreadsheet, Download, BarChart3 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  gerarClimaRelatorioPdf,
  exportClimaDimensoesCsv,
  exportClimaResumoCsv,
  type ClimaReportInput,
} from '@/lib/climaReport';
import { DIMENSAO_LABEL, interpretarClima, type ClimaDimensao } from '@/lib/climaQuestoes';

export default function Nr1ClimaRelatorios() {
  const { activeCompanyId } = useCompanyContext();
  const { data: role } = useCurrentUserRole();
  const [pesquisaId, setPesquisaId] = useState<string>('');

  const canManage = !!(role?.isAdmin || role?.isHR || role?.isSuperAdmin);

  const { data: empresa } = useQuery({
    queryKey: ['empresa-info', activeCompanyId],
    enabled: !!activeCompanyId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('companies').select('name, fantasy_name').eq('id', activeCompanyId).single();
      return data;
    },
  });

  const { data: pesquisas = [] } = useQuery({
    queryKey: ['clima-relatorios-pesquisas', activeCompanyId],
    enabled: !!activeCompanyId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('clima_pesquisas')
        .select('*')
        .eq('company_id', activeCompanyId)
        .order('created_at', { ascending: false });
      return (data ?? []) as any[];
    },
  });

  const pesquisa = useMemo(
    () => pesquisas.find((p) => p.id === pesquisaId) || pesquisas[0],
    [pesquisas, pesquisaId]
  );

  const { data: copsoq } = useQuery({
    queryKey: ['copsoq-latest', activeCompanyId],
    enabled: !!activeCompanyId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('nr1_diagnosticos')
        .select('score_geral, scores_dimensao')
        .eq('company_id', activeCompanyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const { data: externoRespostas = [] } = useQuery({
    queryKey: ['clima-externo-respostas-relatorio', pesquisa?.id],
    enabled: !!pesquisa?.id && pesquisa?.modalidade === 'com_clientes_externos',
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('clima_externo_respostas').select('*').eq('pesquisa_id', pesquisa.id);
      return (data ?? []) as any[];
    },
  });

  const externoStats = useMemo(() => {
    if (!externoRespostas.length) return null;
    const npsVals = externoRespostas.map((r) => r.nps).filter((n: any) => typeof n === 'number');
    const promotores = npsVals.filter((n: number) => n >= 9).length;
    const detratores = npsVals.filter((n: number) => n <= 6).length;
    const nps = npsVals.length ? Math.round(((promotores - detratores) / npsVals.length) * 100) : null;
    const by_stakeholder: Record<string, { count: number; nps: number | null }> = {};
    for (const r of externoRespostas) {
      const k = r.tipo_stakeholder || 'outro';
      by_stakeholder[k] ??= { count: 0, nps: null };
      by_stakeholder[k].count += 1;
    }
    return { total_respondentes: externoRespostas.length, nps, by_stakeholder };
  }, [externoRespostas]);

  const buildInput = (): ClimaReportInput | null => {
    if (!pesquisa || !empresa) return null;
    return {
      empresa: { nome: empresa.name, fantasia: empresa.fantasy_name },
      pesquisa: {
        nome: pesquisa.nome,
        periodo_inicio: pesquisa.periodo_inicio,
        periodo_fim: pesquisa.periodo_fim,
        total_respondentes: pesquisa.total_respondentes,
        score_geral: pesquisa.score_geral,
        scores_dimensao: pesquisa.scores_dimensao,
        modalidade: pesquisa.modalidade,
      },
      copsoq: copsoq ?? null,
      externo: externoStats,
    };
  };

  const gerarPdf = () => {
    const input = buildInput();
    if (!input) {
      toast({ title: 'Sem dados', description: 'Selecione uma pesquisa com respostas.', variant: 'destructive' });
      return;
    }
    const doc = gerarClimaRelatorioPdf(input);
    doc.save(`relatorio_clima_${pesquisa.nome.replace(/\s+/g, '_')}.pdf`);
    toast({ title: 'PDF gerado', description: 'Relatório executivo baixado.' });
  };

  const exportDimensoes = () => {
    const input = buildInput();
    if (!input) return;
    exportClimaDimensoesCsv(input);
  };

  const exportResumo = () => {
    const input = buildInput();
    if (!input) return;
    exportClimaResumoCsv(input);
  };

  if (!canManage) {
    return <Card><CardContent className="py-10 text-center text-muted-foreground">Acesso restrito a Admin/RH.</CardContent></Card>;
  }

  const dims = pesquisa?.scores_dimensao
    ? (Object.entries(pesquisa.scores_dimensao) as [ClimaDimensao, number][]).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/nr1/clima"><ArrowLeft className="h-4 w-4 mr-1" />Voltar</Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Relatórios Executivos — Clima 360°</h1>
          <p className="text-sm text-muted-foreground">
            Exporte PDF executivo (capa, dimensões, correlação COPSOQ, employer branding, recomendações) e planilhas CSV.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ciclo de pesquisa</CardTitle>
          <CardDescription>Escolha o ciclo a consolidar no relatório.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={pesquisa?.id || ''} onValueChange={setPesquisaId}>
            <SelectTrigger className="max-w-md"><SelectValue placeholder="Selecione um ciclo…" /></SelectTrigger>
            <SelectContent>
              {pesquisas.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nome} · {p.total_respondentes} resp. · score {p.score_geral?.toFixed(1) ?? '—'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {pesquisa && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <Stat label="Respondentes" value={String(pesquisa.total_respondentes)} />
              <Stat label="Score geral" value={pesquisa.score_geral?.toFixed(1) ?? '—'} />
              <Stat label="Interpretação" value={interpretarClima(pesquisa.score_geral).label} />
              <Stat label="COPSOQ vinculado" value={copsoq ? 'Sim' : 'Não'} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-3 gap-3">
        <ExportCard
          icon={<FileText className="h-5 w-5" />}
          title="PDF Executivo"
          desc="Capa, sumário, dimensões, correlação COPSOQ, NPS externo e recomendações."
          onClick={gerarPdf}
          disabled={!pesquisa}
        />
        <ExportCard
          icon={<FileSpreadsheet className="h-5 w-5" />}
          title="CSV — Dimensões"
          desc="Score, interpretação e fator COPSOQ por dimensão."
          onClick={exportDimensoes}
          disabled={!pesquisa || !dims.length}
        />
        <ExportCard
          icon={<FileSpreadsheet className="h-5 w-5" />}
          title="CSV — Resumo executivo"
          desc="Indicadores-chave consolidados (uma linha por métrica)."
          onClick={exportResumo}
          disabled={!pesquisa}
        />
      </div>

      {pesquisa && dims.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[hsl(11_77%_60%)]" /> Preview do relatório
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {dims.map(([d, s]) => {
              const i = interpretarClima(s);
              const color = i.color === 'critico' || i.color === 'insatisfatorio'
                ? 'hsl(0 70% 55%)' : i.color === 'moderado' ? 'hsl(38 90% 55%)' : 'hsl(160 70% 45%)';
              return (
                <div key={d} className="flex items-center gap-2 text-xs">
                  <div className="w-52 truncate" title={DIMENSAO_LABEL[d]}>{DIMENSAO_LABEL[d]}</div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full" style={{ width: `${(s / 5) * 100}%`, background: color }} />
                  </div>
                  <Badge variant="outline" className="font-mono">{s.toFixed(1)}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}

function ExportCard({ icon, title, desc, onClick, disabled }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void; disabled: boolean }) {
  return (
    <Card className="hover:border-[hsl(11_77%_60%/0.5)] transition-colors">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-md bg-[hsl(11_77%_60%/0.15)] text-[hsl(11_77%_60%)] flex items-center justify-center">
            {icon}
          </div>
          <p className="font-semibold">{title}</p>
        </div>
        <p className="text-xs text-muted-foreground">{desc}</p>
        <Button size="sm" className="w-full" onClick={onClick} disabled={disabled}>
          <Download className="h-3.5 w-3.5 mr-1.5" /> Baixar
        </Button>
      </CardContent>
    </Card>
  );
}
