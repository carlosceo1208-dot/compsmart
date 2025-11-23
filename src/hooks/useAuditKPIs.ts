import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AuditFilters } from './useAuditLogs';

export interface AuditKPIs {
  total_queries: number;
  total_tokens: number;
  avg_response_time: number;
  unique_users: number;
  legal_queries: number;
  incentive_queries: number;
}

export const useAuditKPIs = (filters: AuditFilters) => {
  return useQuery({
    queryKey: ['audit-kpis', filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_agent_usage_kpis', {
        p_start_date: filters.startDate.toISOString(),
        p_end_date: filters.endDate.toISOString(),
        p_root_company_id: filters.companyId || null,
        p_agent_type: filters.agentType || null,
        p_user_id: filters.userId || null
      });

      if (error) throw error;
      
      return (data && data.length > 0 ? data[0] : {
        total_queries: 0,
        total_tokens: 0,
        avg_response_time: 0,
        unique_users: 0,
        legal_queries: 0,
        incentive_queries: 0
      }) as AuditKPIs;
    },
    staleTime: 30000
  });
};
