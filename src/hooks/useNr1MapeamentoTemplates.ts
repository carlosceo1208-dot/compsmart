import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

export type MetodologiaMatriz = 'COPSOQ-III' | 'HSE' | 'JCQ' | 'ERI' | 'OUTRA';

export interface MapeamentoTemplate {
  id: string;
  company_id: string;
  metodologia: MetodologiaMatriz;
  nome: string;
  descricao: string | null;
  mapeamento: Record<string, string>; // coluna externa -> campo CompSmart
  is_default: boolean;
  uso_count: number;
  ultimo_uso_em: string | null;
  created_at: string;
  updated_at: string;
}

export const CAMPOS_DESTINO: Array<{ value: string; label: string; grupo: string }> = [
  { value: 'ignorar', label: 'Ignorar coluna', grupo: 'Geral' },
  // COPSOQ-III dimensões
  { value: 'dim_demandas_trabalho', label: 'Dimensão: Demandas no Trabalho', grupo: 'Dimensão COPSOQ-III' },
  { value: 'dim_organizacao_conteudo', label: 'Dimensão: Organização e Conteúdo', grupo: 'Dimensão COPSOQ-III' },
  { value: 'dim_relacoes_lideranca', label: 'Dimensão: Relações e Liderança', grupo: 'Dimensão COPSOQ-III' },
  { value: 'dim_interface_trabalho_individuo', label: 'Dimensão: Interface Trabalho-Indivíduo', grupo: 'Dimensão COPSOQ-III' },
  { value: 'dim_valores_trabalho', label: 'Dimensão: Valores no Trabalho', grupo: 'Dimensão COPSOQ-III' },
  { value: 'dim_saude_bem_estar', label: 'Dimensão: Saúde e Bem-Estar', grupo: 'Dimensão COPSOQ-III' },
  // Campos de risco
  { value: 'fator_nome', label: 'Nome do Fator/Perigo', grupo: 'Risco' },
  { value: 'severidade', label: 'Severidade / Gravidade', grupo: 'Risco' },
  { value: 'probabilidade', label: 'Probabilidade / Frequência', grupo: 'Risco' },
  { value: 'score_risco', label: 'Score / Nível de Risco', grupo: 'Risco' },
  // Contexto
  { value: 'unidade_setor', label: 'Unidade / Setor / Área', grupo: 'Contexto' },
  { value: 'cargo_funcao', label: 'Cargo / Função', grupo: 'Contexto' },
  { value: 'descricao', label: 'Descrição / Observação', grupo: 'Contexto' },
  { value: 'plano_acao', label: 'Plano de Ação / Medida', grupo: 'Ação' },
  { value: 'prazo', label: 'Prazo / Data', grupo: 'Ação' },
  { value: 'responsavel', label: 'Responsável', grupo: 'Ação' },
];

export const useNr1MapeamentoTemplates = (metodologia?: MetodologiaMatriz) => {
  const { activeCompanyId } = useCompanyContext();
  return useQuery({
    queryKey: ['nr1-map-templates', activeCompanyId, metodologia],
    enabled: !!activeCompanyId,
    queryFn: async () => {
      let q = supabase
        .from('nr1_mapeamentos_templates')
        .select('*')
        .eq('company_id', activeCompanyId!)
        .order('is_default', { ascending: false })
        .order('uso_count', { ascending: false });
      if (metodologia) q = q.eq('metodologia', metodologia);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as MapeamentoTemplate[];
    },
  });
};

export const useSalvarMapeamentoTemplate = () => {
  const qc = useQueryClient();
  const { activeCompanyId } = useCompanyContext();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      metodologia: MetodologiaMatriz;
      nome: string;
      descricao?: string;
      mapeamento: Record<string, string>;
      is_default?: boolean;
    }) => {
      if (!activeCompanyId) throw new Error('Empresa não identificada');
      const payload = {
        company_id: activeCompanyId,
        metodologia: input.metodologia,
        nome: input.nome.trim(),
        descricao: input.descricao?.trim() || null,
        mapeamento: input.mapeamento,
        is_default: input.is_default ?? false,
      };
      if (input.id) {
        const { data, error } = await supabase
          .from('nr1_mapeamentos_templates')
          .update(payload).eq('id', input.id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from('nr1_mapeamentos_templates')
        .upsert(payload, { onConflict: 'company_id,metodologia,nome' })
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nr1-map-templates'] });
      toast.success('Template de mapeamento salvo');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const marcarUsoTemplate = async (templateId: string) => {
  await supabase.rpc('nr1_template_marcar_uso' as any, { _template_id: templateId });
};
