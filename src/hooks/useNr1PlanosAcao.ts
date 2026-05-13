import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { toast } from '@/hooks/use-toast';
import type { GrauRiscoInss } from '@/lib/nr1Risco';

export type Nr1AcaoStatus = 'pendente' | 'em_andamento' | 'concluido' | 'atrasado';
export type Nr1AcaoPrioridade = 'baixa' | 'media' | 'alta' | 'critica';

export interface Nr1PlanoAcao {
  id: string;
  company_id: string;
  diagnostico_id: string | null;
  titulo: string;
  descricao: string | null;
  dimensao: string | null;
  responsavel: string | null;
  prazo: string | null;
  status: Nr1AcaoStatus;
  prioridade: Nr1AcaoPrioridade;
  progresso: number;
  evidencias: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useNr1PlanosAcao = () => {
  const { activeCompanyId } = useCompanyContext();
  return useQuery({
    queryKey: ['nr1-planos-acao', activeCompanyId],
    enabled: !!activeCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nr1_planos_acao' as any)
        .select('*')
        .eq('company_id', activeCompanyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Nr1PlanoAcao[];
    },
  });
};

export const useUpsertPlanoAcao = () => {
  const qc = useQueryClient();
  const { activeCompanyId } = useCompanyContext();
  return useMutation({
    mutationFn: async (input: Partial<Nr1PlanoAcao> & { titulo: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const payload: any = {
        ...input,
        company_id: activeCompanyId,
        created_by: input.created_by ?? user?.id,
      };
      if (input.id) {
        const { error } = await supabase.from('nr1_planos_acao' as any).update(payload).eq('id', input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('nr1_planos_acao' as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nr1-planos-acao', activeCompanyId] });
      toast({ title: 'Plano de ação salvo' });
    },
    onError: (e: any) => toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' }),
  });
};

export const useDeletePlanoAcao = () => {
  const qc = useQueryClient();
  const { activeCompanyId } = useCompanyContext();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('nr1_planos_acao' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nr1-planos-acao', activeCompanyId] });
      toast({ title: 'Ação excluída' });
    },
  });
};

export const useUpdateGrauRiscoInss = () => {
  const qc = useQueryClient();
  const { activeCompanyId } = useCompanyContext();
  return useMutation({
    mutationFn: async (grau: GrauRiscoInss) => {
      const { error } = await supabase
        .from('nr1_subscriptions')
        .update({ grau_risco_inss: grau } as any)
        .eq('company_id', activeCompanyId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nr1-subscription', activeCompanyId] });
      toast({ title: 'Grau de risco atualizado' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
};
