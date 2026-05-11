import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';

export const useNr1Subscription = () => {
  const { activeCompanyId } = useCompanyContext();
  return useQuery({
    queryKey: ['nr1-subscription', activeCompanyId],
    enabled: !!activeCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nr1_subscriptions')
        .select('*')
        .eq('company_id', activeCompanyId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
};

export const useNr1Diagnosticos = () => {
  const { activeCompanyId } = useCompanyContext();
  return useQuery({
    queryKey: ['nr1-diagnosticos', activeCompanyId],
    enabled: !!activeCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nr1_diagnosticos')
        .select('*')
        .eq('company_id', activeCompanyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
};

export const useNr1Diagnostico = (id: string | undefined) => {
  return useQuery({
    queryKey: ['nr1-diagnostico', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nr1_diagnosticos')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
};

export const useNr1Questoes = (freeOnly = false) => {
  return useQuery({
    queryKey: ['nr1-questoes', freeOnly],
    queryFn: async () => {
      let q = supabase.from('nr1_questoes').select('*').eq('ativo', true).order('ordem');
      if (freeOnly) q = q.eq('is_free_diagnostic', true);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
};
