import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';

interface CompanyIdentity {
  id: string;
  root_company_id: string;
  mission: string | null;
  vision: string | null;
  values: string[];
  annual_goal_year: number | null;
  annual_goal_description: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export const useCompanyIdentity = () => {
  const { activeCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['company-identity', activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return null;

      const { data, error } = await supabase
        .from('company_identity')
        .select('*')
        .eq('root_company_id', activeCompanyId)
        .maybeSingle();
      
      if (error) throw error;
      
      // Parse values from jsonb to array
      if (data && data.values) {
        return {
          ...data,
          values: Array.isArray(data.values) ? data.values : []
        } as CompanyIdentity;
      }
      
      return data as CompanyIdentity | null;
    },
    enabled: !!activeCompanyId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
