import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AuditFilters } from './useAuditLogs';
import { format, eachDayOfInterval } from 'date-fns';

export interface DailyUsageData {
  date: string;
  legal: number;
  incentive: number;
  total: number;
}

export interface OperationModeData {
  mode: string;
  count: number;
  percentage: number;
}

export const useAuditCharts = (filters: AuditFilters) => {
  return useQuery({
    queryKey: ['audit-charts', filters],
    queryFn: async () => {
      const { data: logs, error } = await supabase.rpc('get_agent_audit_logs', {
        p_start_date: filters.startDate.toISOString(),
        p_end_date: filters.endDate.toISOString(),
        p_root_company_id: filters.companyId || null,
        p_agent_type: filters.agentType || null,
        p_user_id: filters.userId || null,
        p_operation_mode: filters.operationMode || null,
        p_limit: 10000,
        p_offset: 0
      });

      if (error) throw error;

      // Daily usage data
      const days = eachDayOfInterval({ start: filters.startDate, end: filters.endDate });
      const dailyUsage: DailyUsageData[] = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayLogs = (logs || []).filter(log => 
          format(new Date(log.created_at), 'yyyy-MM-dd') === dayStr
        );
        
        return {
          date: format(day, 'dd/MM'),
          legal: dayLogs.filter(l => l.agent_type === 'legal').length,
          incentive: dayLogs.filter(l => l.agent_type === 'incentive').length,
          total: dayLogs.length
        };
      });

      // Operation mode distribution
      const modeCount = (logs || []).reduce((acc, log) => {
        const mode = log.operation_mode || 'N/A';
        acc[mode] = (acc[mode] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const total = logs?.length || 0;
      const operationModes: OperationModeData[] = Object.entries(modeCount)
        .map(([mode, count]) => ({
          mode,
          count,
          percentage: total > 0 ? (count / total) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count);

      // Tokens by day
      const tokensByDay = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayLogs = (logs || []).filter(log => 
          format(new Date(log.created_at), 'yyyy-MM-dd') === dayStr
        );
        
        return {
          date: format(day, 'dd/MM'),
          tokens: dayLogs.reduce((sum, log) => sum + (log.tokens_used || 0), 0)
        };
      });

      return {
        dailyUsage,
        operationModes,
        tokensByDay
      };
    },
    staleTime: 30000
  });
};
