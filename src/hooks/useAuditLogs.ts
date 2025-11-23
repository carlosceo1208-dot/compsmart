import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuditFilters {
  startDate: Date;
  endDate: Date;
  companyId?: string;
  userId?: string;
  agentType?: 'legal' | 'incentive' | null;
  operationMode?: string;
}

export interface ConversationLog {
  id: string;
  agent_type: 'legal' | 'incentive';
  user_id: string;
  user_name: string;
  user_email: string;
  company_name: string;
  user_roles: string;
  question: string;
  answer: string;
  document_name?: string;
  operation_mode?: string;
  tokens_used: number;
  response_time_ms: number;
  created_at: string;
}

export const useAuditLogs = (filters: AuditFilters, page: number) => {
  return useQuery({
    queryKey: ['audit-logs', filters, page],
    queryFn: async () => {
      const pageSize = 20;
      const offset = (page - 1) * pageSize;

      const { data: logs, error: logsError } = await supabase.rpc('get_agent_audit_logs', {
        p_start_date: filters.startDate.toISOString(),
        p_end_date: filters.endDate.toISOString(),
        p_root_company_id: filters.companyId || null,
        p_agent_type: filters.agentType || null,
        p_user_id: filters.userId || null,
        p_operation_mode: filters.operationMode || null,
        p_limit: pageSize,
        p_offset: offset
      });

      if (logsError) throw logsError;

      const { data: count, error: countError } = await supabase.rpc('count_agent_audit_logs', {
        p_start_date: filters.startDate.toISOString(),
        p_end_date: filters.endDate.toISOString(),
        p_agent_type: filters.agentType || null,
        p_user_id: filters.userId || null,
        p_operation_mode: filters.operationMode || null
      });

      if (countError) throw countError;

      return {
        logs: (logs || []) as ConversationLog[],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    },
    staleTime: 30000,
    enabled: true
  });
};
