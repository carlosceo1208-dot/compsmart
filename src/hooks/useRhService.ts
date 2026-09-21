import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];
export type Consultor = Tables['consultores']['Row'];
export type RhProjeto = Tables['rh_service_projetos']['Row'];
export type RhHora = Tables['rh_service_horas']['Row'];
export type RhDiagnostico = Tables['rh_service_diagnosticos']['Row'];
export type RhScore = Tables['rh_service_diagnostico_scores']['Row'];
export type RhRecomendacao = Tables['rh_service_recomendacoes']['Row'];

export const PROJETO_STATUS_LABELS: Record<string, string> = {
  proposta: 'Proposta',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
};

export const DIAGNOSTICO_STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  concluido: 'Concluído',
};

export const ORIGEM_LABELS: Record<string, string> = {
  auto: 'Automática',
  editada: 'Editada',
  manual: 'Manual',
};

/**
 * Acesso LOCAL ao módulo RH Service.
 *
 * O papel `consultor` é reconhecido APENAS aqui e nas telas do RH Service.
 * Nunca estenda este reconhecimento para useCurrentUserRole/useFeatureAccess:
 * o consultor não deve ganhar acesso a remuneração, desempenho, NR-1, clima
 * ou qualquer outro módulo.
 */
export const useRhServiceAccess = () => {
  const { data: roleData, isLoading: roleLoading } = useCurrentUserRole();

  const consultorQuery = useQuery({
    queryKey: ['rh-service-is-consultor'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'consultor')
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  const isConsultor = consultorQuery.data === true;
  const isSuperAdmin = !!roleData?.isSuperAdmin;
  const isClientViewer = !!roleData?.isAdmin || !!roleData?.isHR;

  return {
    loading: roleLoading || consultorQuery.isLoading,
    // Somente equipe CompSmart escreve (espelha rh_service_can_write no banco)
    isRhServiceEditor: isSuperAdmin || isConsultor,
    // Leitura: equipe CompSmart + admin/RH do cliente (espelha rh_service_can_read)
    canReadRhService: isSuperAdmin || isConsultor || isClientViewer,
    isConsultor,
    isSuperAdmin,
  };
};

const useTenantId = () => {
  const { activeCompanyId } = useCompanyContext();
  return activeCompanyId ?? null;
};

export const useRhConsultores = (enabled: boolean) => {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: ['rh-service-consultores', tenantId],
    enabled: enabled && !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultores')
        .select('*')
        .eq('tenant_id', tenantId!)
        .order('nome', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
};

export const useRhProjetos = (enabled: boolean) => {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: ['rh-service-projetos', tenantId],
    enabled: enabled && !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rh_service_projetos')
        .select('*, consultores(id, nome)')
        .eq('tenant_id', tenantId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as (RhProjeto & { consultores: { id: string; nome: string } | null })[];
    },
  });
};

export const useRhHoras = (enabled: boolean) => {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: ['rh-service-horas', tenantId],
    enabled: enabled && !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rh_service_horas')
        .select('*, consultores(id, nome), rh_service_projetos(id, titulo)')
        .eq('tenant_id', tenantId!)
        .order('data', { ascending: false });
      if (error) throw error;
      return (data ?? []) as (RhHora & {
        consultores: { id: string; nome: string } | null;
        rh_service_projetos: { id: string; titulo: string } | null;
      })[];
    },
  });
};

export const useRhDiagnosticos = (enabled: boolean) => {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: ['rh-service-diagnosticos', tenantId],
    enabled: enabled && !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rh_service_diagnosticos')
        .select('*, consultores(id, nome), rh_service_projetos(id, titulo)')
        .eq('tenant_id', tenantId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as (RhDiagnostico & {
        consultores: { id: string; nome: string } | null;
        rh_service_projetos: { id: string; titulo: string } | null;
      })[];
    },
  });
};

export const useRhDiagnosticoDetalhe = (diagnosticoId: string | null) => {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: ['rh-service-diagnostico-detalhe', tenantId, diagnosticoId],
    enabled: !!tenantId && !!diagnosticoId,
    queryFn: async () => {
      const [scores, recomendacoes] = await Promise.all([
        supabase
          .from('rh_service_diagnostico_scores')
          .select('*')
          .eq('tenant_id', tenantId!)
          .eq('diagnostico_id', diagnosticoId!)
          .order('score', { ascending: true }),
        supabase
          .from('rh_service_recomendacoes')
          .select('*')
          .eq('tenant_id', tenantId!)
          .eq('diagnostico_id', diagnosticoId!)
          .order('module_slug', { ascending: true }),
      ]);
      if (scores.error) throw scores.error;
      if (recomendacoes.error) throw recomendacoes.error;
      return {
        scores: (scores.data ?? []) as RhScore[],
        recomendacoes: (recomendacoes.data ?? []) as RhRecomendacao[],
      };
    },
  });
};

type ConsultorInput = {
  id?: string;
  nome: string;
  email: string;
  especialidade: string | null;
  bio: string | null;
  ativo: boolean;
};

export const useSaveConsultor = () => {
  const tenantId = useTenantId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ConsultorInput) => {
      if (!tenantId) throw new Error('Nenhuma empresa ativa selecionada.');
      if (input.id) {
        const { error } = await supabase
          .from('consultores')
          .update({
            nome: input.nome,
            email: input.email,
            especialidade: input.especialidade,
            bio: input.bio,
            ativo: input.ativo,
          })
          .eq('id', input.id)
          .eq('tenant_id', tenantId);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from('consultores').insert({
        tenant_id: tenantId,
        nome: input.nome,
        email: input.email,
        especialidade: input.especialidade,
        bio: input.bio,
        ativo: input.ativo,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rh-service-consultores', tenantId] });
      toast.success('Consultor salvo com sucesso.');
    },
    onError: (error: Error) => toast.error('Não foi possível salvar o consultor.', { description: error.message }),
  });
};

type ProjetoInput = {
  id?: string;
  titulo: string;
  descricao: string | null;
  escopo: string | null;
  consultor_id: string | null;
  status: string;
  horas_estimadas: number | null;
  valor_negociado: number | null;
  data_inicio: string | null;
  data_fim: string | null;
};

export const useSaveProjeto = () => {
  const tenantId = useTenantId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProjetoInput) => {
      if (!tenantId) throw new Error('Nenhuma empresa ativa selecionada.');
      const payload = {
        titulo: input.titulo,
        descricao: input.descricao,
        escopo: input.escopo,
        consultor_id: input.consultor_id,
        status: input.status,
        horas_estimadas: input.horas_estimadas,
        valor_negociado: input.valor_negociado,
        data_inicio: input.data_inicio,
        data_fim: input.data_fim,
      };
      if (input.id) {
        const { error } = await supabase
          .from('rh_service_projetos')
          .update(payload)
          .eq('id', input.id)
          .eq('tenant_id', tenantId);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from('rh_service_projetos').insert({ ...payload, tenant_id: tenantId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rh-service-projetos', tenantId] });
      toast.success('Projeto salvo com sucesso.');
    },
    onError: (error: Error) => toast.error('Não foi possível salvar o projeto.', { description: error.message }),
  });
};

type HoraInput = {
  id?: string;
  projeto_id: string;
  consultor_id: string | null;
  horas: number;
  descricao: string | null;
  data: string;
};

export const useSaveHora = () => {
  const tenantId = useTenantId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: HoraInput) => {
      if (!tenantId) throw new Error('Nenhuma empresa ativa selecionada.');
      const payload = {
        projeto_id: input.projeto_id,
        consultor_id: input.consultor_id,
        horas: input.horas,
        descricao: input.descricao,
        data: input.data,
      };
      if (input.id) {
        const { error } = await supabase
          .from('rh_service_horas')
          .update(payload)
          .eq('id', input.id)
          .eq('tenant_id', tenantId);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from('rh_service_horas').insert({ ...payload, tenant_id: tenantId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rh-service-horas', tenantId] });
      toast.success('Registro de horas salvo.');
    },
    onError: (error: Error) => toast.error('Não foi possível salvar as horas.', { description: error.message }),
  });
};
