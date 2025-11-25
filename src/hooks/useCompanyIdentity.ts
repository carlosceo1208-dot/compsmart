import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  return useQuery({
    queryKey: ['company-identity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_identity')
        .select('*')
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
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
