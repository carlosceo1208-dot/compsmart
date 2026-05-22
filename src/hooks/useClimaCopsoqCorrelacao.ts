import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { toast } from '@/hooks/use-toast';

export type CorrelacaoStatus = 'critico' | 'moderado' | 'positivo' | 'sem_dados';
export type CorrelacaoPrioridade = 'causa_raiz' | 'atencao' | 'ok' | 'sem_dados';

export interface CorrelacaoRow {
  company_id: string;
  clima_id: string;
  clima_nome: string;
  clima_respondentes: number;
  diagnostico_id: string;
  diag_nome: string;
  diag_respondentes: number;
  clima_dim: string;
  copsoq_dim: string;
  clima_score: number | null;
  copsoq_score_raw: number | null;
  copsoq_score_eq: number | null;
  clima_status: CorrelacaoStatus;
  copsoq_status: CorrelacaoStatus;
  prioridade: CorrelacaoPrioridade;
}

const RECOMENDACAO: Record<string, string> = {
  reconhecimento_recompensa: 'Revisar política de remuneração, programa de reconhecimento e PLR/bônus.',
  autonomia_empowerment: 'Capacitar lideranças em delegação; reduzir microgerenciamento.',
  equilibrio_trabalho_vida: 'Política formal de desconexão e monitoramento de horas extras.',
  confianca_lideranca: 'Programa de desenvolvimento de líderes e feedback 360°.',
  comunicacao_interna: 'Reuniões de alinhamento periódicas e transparência de OKRs.',
  desenvolvimento_profissional: 'Trilhas de carreira formais, mentoria e orçamento de capacitação.',
  relacionamento_colegas: 'Rituais de integração e dinâmicas de team building.',
  seguranca_psicologica: 'Canal de denúncia confidencial e treinamento contra assédio.',
  qualidade_ambiente: 'Avaliação ergonômica, atualização de ferramentas e saúde ocupacional.',
  proposito_alinhamento: 'Reforçar missão/visão/valores e conexão impacto-trabalho.',
};

export const useClimaCopsoqCorrelacao = () => {
  const { activeCompanyId } = useCompanyContext();
  return useQuery({
    queryKey: ['nr1-clima-copsoq-correlacao', activeCompanyId],
    enabled: !!activeCompanyId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('vw_nr1_clima_copsoq_correlacao')
        .select('*')
        .eq('company_id', activeCompanyId);
      if (error) throw error;
      return (data ?? []) as CorrelacaoRow[];
    },
  });
};

export const useGerarPlanoUnificado = () => {
  const qc = useQueryClient();
  const { activeCompanyId } = useCompanyContext();
  return useMutation({
    mutationFn: async (rows: CorrelacaoRow[]) => {
      if (!activeCompanyId) throw new Error('Empresa não selecionada');
      const { data: { user } } = await supabase.auth.getUser();
      const causasRaiz = rows.filter((r) => r.prioridade === 'causa_raiz');
      if (causasRaiz.length === 0) throw new Error('Nenhuma causa raiz identificada para gerar plano unificado');

      const payload = causasRaiz.map((r) => ({
        company_id: activeCompanyId,
        diagnostico_id: r.diagnostico_id,
        clima_pesquisa_id: r.clima_id,
        titulo: `Ação Unificada: ${r.clima_dim.replace(/_/g, ' ')}`,
        descricao: RECOMENDACAO[r.clima_dim] ?? 'Definir ação corretiva específica com a liderança.',
        dimensao: r.copsoq_dim,
        dimensoes_relacionadas: [r.clima_dim, r.copsoq_dim],
        prioridade: 'critica' as const,
        status: 'pendente' as const,
        origem: 'unificado' as const,
        aprovacao_status: 'em_aprovacao' as const,
        progresso: 0,
        created_by: user?.id ?? null,
      }));

      const { error } = await (supabase as any).from('nr1_planos_acao').insert(payload);
      if (error) throw error;
      return payload.length;
    },
    onSuccess: (n) => {
      toast({ title: 'Plano unificado gerado', description: `${n} ação(ões) criada(s) e enviada(s) para aprovação.` });
      qc.invalidateQueries({ queryKey: ['nr1-planos-acao'] });
      qc.invalidateQueries({ queryKey: ['nr1-planos-gov'] });
    },
    onError: (e: any) => toast({ title: 'Erro ao gerar plano', description: e.message, variant: 'destructive' }),
  });
};
