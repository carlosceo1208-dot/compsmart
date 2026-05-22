import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, GitCompare, AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';
import { DIMENSAO_LABEL, type ClimaDimensao } from '@/lib/climaQuestoes';

type Nr1Dimensao =
  | 'demandas_trabalho' | 'organizacao_conteudo' | 'relacoes_lideranca'
  | 'interface_trabalho_individuo' | 'valores_trabalho' | 'saude_bem_estar';

const NR1_LABEL: Record<Nr1Dimensao, string> = {
  demandas_trabalho: 'Demandas do Trabalho',
  organizacao_conteudo: 'Organização e Conteúdo',
  relacoes_lideranca: 'Relações e Liderança',
  interface_trabalho_individuo: 'Interface Trabalho-Indivíduo',
  valores_trabalho: 'Valores do Trabalho',
  saude_bem_estar: 'Saúde e Bem-Estar',
};

// Mapeamento Clima → COPSOQ-III
const MAP_CLIMA_COPSOQ: Record<ClimaDimensao, Nr1Dimensao> = {
  reconhecimento_recompensa: 'valores_trabalho',
  autonomia_empowerment: 'organizacao_conteudo',
  equilibrio_trabalho_vida: 'interface_trabalho_individuo',
  confianca_lideranca: 'relacoes_lideranca',
  comunicacao_interna: 'organizacao_conteudo',
  desenvolvimento_profissional: 'valores_trabalho',
  relacionamento_colegas: 'relacoes_lideranca',
  seguranca_psicologica: 'relacoes_lideranca',
  qualidade_ambiente: 'demandas_trabalho',
  proposito_alinhamento: 'valores_trabalho',
};

// Recomendações por par crítico
const RECOMENDACOES: Partial<Record<ClimaDimensao, string>> = {
  reconhecimento_recompensa: 'Revisar política de remuneração, programa de reconhecimento e plano de bônus/PLR.',
  autonomia_empowerment: 'Capacitar lideranças em delegação; reduzir microgerenciamento; mapear decisões delegáveis.',
  equilibrio_trabalho_vida: 'Política formal de desconexão, flexibilidade de horários, monitoramento de horas extras.',
  confianca_lideranca: 'Programa de desenvolvimento de líderes, escuta ativa estruturada, feedback 360°.',
  comunicacao_interna: 'Reuniões de alinhamento periódicas, canal de feedback contínuo, transparência de OKRs.',
  desenvolvimento_profissional: 'Trilhas de carreira formais, mentoria, orçamento de capacitação por colaborador.',
  relacionamento_colegas: 'Rituais de integração, espaços colaborativos, dinâmicas de team building.',
  seguranca_psicologica: 'Canal de denúncia confidencial, treinamento contra assédio, política DEI ativa.',
  qualidade_ambiente: 'Avaliação ergonômica, atualização de ferramentas, plano de saúde ocupacional.',
  proposito_alinhamento: 'Reforçar missão/visão/valores, storytelling interno, conexão impacto-trabalho.',
};

type ClimaPesquisa = { id: string; nome: string; status: string; periodo_inicio: string; score_geral: number | null; scores_dimensao: Record<string, number> | null; total_respondentes: number };
type Diagnostico = { id: string; ciclo_nome: string; status: string; periodo_inicio: string; score_geral: number | null; scores_dimensao: Record<string, number> | null; total_respondentes: number };

// Converte score COPSOQ (0-100, onde maior = mais risco) em escala 1-5 equivalente ao clima (maior = melhor)
function copsoqToFive(score: number | null): number | null {
  if (score == null) return null;
  // 0 risco = 5 / 100 risco = 1
  return 5 - (score / 100) * 4;
}

function statusFromScore(score: number | null): 'critico' | 'moderado' | 'positivo' | 'sem_dados' {
  if (score == null) return 'sem_dados';
  if (score <= 3.0) return 'critico';
  if (score <= 3.5) return 'moderado';
  return 'positivo';
}

export default function Nr1ClimaCorrelacao() {
  const { activeCompanyId } = useCompanyContext();

  const { data: climaPesquisas = [] } = useQuery({
    queryKey: ['corr-clima', activeCompanyId],
    enabled: !!activeCompanyId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('clima_pesquisas')
        .select('id,nome,status,periodo_inicio,score_geral,scores_dimensao,total_respondentes')
        .eq('company_id', activeCompanyId)
        .order('periodo_inicio', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ClimaPesquisa[];
    },
  });

  const { data: diagnosticos = [] } = useQuery({
    queryKey: ['corr-diag', activeCompanyId],
    enabled: !!activeCompanyId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('nr1_diagnosticos')
        .select('id,ciclo_nome,status,periodo_inicio,score_geral,scores_dimensao,total_respondentes')
        .eq('company_id', activeCompanyId)
        .order('periodo_inicio', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Diagnostico[];
    },
  });

  const climaAtual = climaPesquisas.find((p) => p.total_respondentes > 0);
  const diagAtual = diagnosticos.find((d) => d.total_respondentes > 0);

  const pares = useMemo(() => {
    if (!climaAtual?.scores_dimensao || !diagAtual?.scores_dimensao) return [];
    return (Object.entries(MAP_CLIMA_COPSOQ) as [ClimaDimensao, Nr1Dimensao][]).map(([cd, nd]) => {
      const climaScore = climaAtual.scores_dimensao?.[cd] ?? null;
      const copsoqRaw = diagAtual.scores_dimensao?.[nd] ?? null;
      const copsoqEq = copsoqToFive(copsoqRaw);
      const climaStatus = statusFromScore(climaScore);
      const copsoqStatus = statusFromScore(copsoqEq);
      const ambos = climaStatus === 'critico' && copsoqStatus === 'critico';
      const gap = climaScore != null && copsoqEq != null ? climaScore - copsoqEq : null;
      return { cd, nd, climaScore, copsoqRaw, copsoqEq, climaStatus, copsoqStatus, ambos, gap };
    }).sort((a, b) => {
      // priorizar pares onde ambos críticos, depois clima crítico, depois copsoq crítico
      const sa = (a.ambos ? 0 : a.climaStatus === 'critico' ? 1 : a.copsoqStatus === 'critico' ? 2 : 3);
      const sb = (b.ambos ? 0 : b.climaStatus === 'critico' ? 1 : b.copsoqStatus === 'critico' ? 2 : 3);
      return sa - sb;
    });
  }, [climaAtual, diagAtual]);

  const causasRaiz = pares.filter((p) => p.ambos);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/nr1/clima"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-[hsl(var(--nr1-primary))]" />
            Correlação Clima × Riscos Psicossociais
          </h1>
          <p className="text-xs text-muted-foreground">Identifica causas raiz comparando dimensões de Clima 360° com COPSOQ-III.</p>
        </div>
      </div>

      {(!climaAtual || !diagAtual) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-6 text-sm">
            <p className="font-semibold flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4" /> Dados insuficientes
            </p>
            <ul className="mt-2 space-y-1 text-amber-700 text-xs list-disc list-inside">
              {!climaAtual && <li>Nenhuma pesquisa de clima com respostas. <Link to="/nr1/clima" className="underline">Criar agora</Link></li>}
              {!diagAtual && <li>Nenhum diagnóstico psicossocial (COPSOQ-III) com respostas. <Link to="/nr1/diagnosticos" className="underline">Iniciar diagnóstico</Link></li>}
            </ul>
          </CardContent>
        </Card>
      )}

      {climaAtual && diagAtual && (
        <>
          <div className="grid sm:grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Clima 360°</CardTitle></CardHeader>
              <CardContent className="text-sm">
                <p className="font-medium">{climaAtual.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {climaAtual.total_respondentes} respondentes · score {climaAtual.score_geral?.toFixed(2) ?? '—'}/5
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Diagnóstico Psicossocial (COPSOQ-III)</CardTitle></CardHeader>
              <CardContent className="text-sm">
                <p className="font-medium">{diagAtual.ciclo_nome}</p>
                <p className="text-xs text-muted-foreground">
                  {diagAtual.total_respondentes} respondentes · risco geral {diagAtual.score_geral?.toFixed(1) ?? '—'}/100
                </p>
              </CardContent>
            </Card>
          </div>

          {causasRaiz.length > 0 && (
            <Card className="border-[hsl(0_70%_50%/0.4)] bg-[hsl(0_70%_50%/0.04)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-[hsl(0_70%_45%)]">
                  <AlertTriangle className="h-4 w-4" /> {causasRaiz.length} causa(s) raiz confirmada(s)
                </CardTitle>
                <CardDescription className="text-xs">
                  Dimensões críticas em ambos os instrumentos — máxima prioridade no plano de ação.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  {causasRaiz.map((p) => (
                    <li key={p.cd} className="flex items-start gap-2">
                      <span className="text-[hsl(0_70%_45%)] mt-0.5">▸</span>
                      <span><strong>{DIMENSAO_LABEL[p.cd]}</strong> ↔ {NR1_LABEL[p.nd]}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Matriz de correlação</CardTitle>
              <CardDescription className="text-xs">
                Scores normalizados em escala 1-5 (maior = melhor). Gap negativo = COPSOQ identifica risco que o Clima não captou.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Dimensão Clima</th>
                    <th className="text-left p-2">Dimensão COPSOQ</th>
                    <th className="p-2 text-center w-20">Clima</th>
                    <th className="p-2 text-center w-20">COPSOQ</th>
                    <th className="p-2 text-center w-16">Gap</th>
                    <th className="p-2 text-center w-28">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pares.map((p) => (
                    <tr key={p.cd} className="border-b">
                      <td className="p-2 font-medium">{DIMENSAO_LABEL[p.cd]}</td>
                      <td className="p-2 text-muted-foreground">{NR1_LABEL[p.nd]}</td>
                      <td className="p-2 text-center font-mono">{p.climaScore?.toFixed(2) ?? '—'}</td>
                      <td className="p-2 text-center font-mono">
                        {p.copsoqEq?.toFixed(2) ?? '—'}
                        {p.copsoqRaw != null && <div className="text-[10px] text-muted-foreground">({p.copsoqRaw.toFixed(0)}/100)</div>}
                      </td>
                      <td className={`p-2 text-center font-mono ${p.gap != null && Math.abs(p.gap) > 0.5 ? (p.gap > 0 ? 'text-emerald-600' : 'text-red-600') : ''}`}>
                        {p.gap != null ? (p.gap > 0 ? '+' : '') + p.gap.toFixed(2) : '—'}
                      </td>
                      <td className="p-2 text-center">
                        {p.ambos ? (
                          <Badge className="bg-red-100 text-red-700 border-red-300">Causa raiz</Badge>
                        ) : p.climaStatus === 'critico' || p.copsoqStatus === 'critico' ? (
                          <Badge variant="outline" className="border-amber-400 text-amber-700">Atenção</Badge>
                        ) : (
                          <Badge variant="outline" className="border-emerald-300 text-emerald-700"><CheckCircle2 className="h-3 w-3 mr-0.5" />OK</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {causasRaiz.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" /> Plano de Ação Unificado
                </CardTitle>
                <CardDescription className="text-xs">Recomendações priorizadas para as causas raiz identificadas.</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm">
                  {causasRaiz.map((p, idx) => (
                    <li key={p.cd} className="flex gap-3">
                      <span className="flex-shrink-0 h-6 w-6 rounded-full bg-[hsl(var(--nr1-primary))] text-white text-xs flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-semibold">{DIMENSAO_LABEL[p.cd]}</p>
                        <p className="text-xs text-muted-foreground mb-1">Conexão COPSOQ: {NR1_LABEL[p.nd]}</p>
                        <p className="text-xs">{RECOMENDACOES[p.cd] ?? 'Definir ação corretiva específica com a liderança.'}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="mt-4 pt-3 border-t flex justify-end">
                  <Button asChild size="sm">
                    <Link to="/nr1/planos-acao">Criar plano de ação formal →</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
