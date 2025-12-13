import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useEffect } from 'react';

interface NotificationCounts {
  pendingApprovals: number;
  activeAlerts: number;
  pendingAdjustments: number;
  total: number;
}

export const useHeaderNotifications = () => {
  const { activeCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const query = useQuery({
    queryKey: ['header-notifications', activeCompanyId],
    queryFn: async (): Promise<NotificationCounts> => {
      if (!activeCompanyId) {
        return { pendingApprovals: 0, activeAlerts: 0, pendingAdjustments: 0, total: 0 };
      }

      // Fetch pending budget approvals
      const { count: pendingApprovals } = await supabase
        .from('budget_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch active alerts
      const { count: activeAlerts } = await supabase
        .from('alert_history')
        .select('*', { count: 'exact', head: true })
        .eq('root_company_id', activeCompanyId)
        .eq('status', 'active');

      // Fetch pending collective adjustments (current month or past due)
      const { count: pendingAdjustments } = await supabase
        .from('collective_salary_adjustments')
        .select('*', { count: 'exact', head: true })
        .eq('root_company_id', activeCompanyId)
        .eq('status', 'approved_budget')
        .eq('fiscal_year', currentYear)
        .lte('effective_month', currentMonth);

      const counts = {
        pendingApprovals: pendingApprovals || 0,
        activeAlerts: activeAlerts || 0,
        pendingAdjustments: pendingAdjustments || 0,
        total: (pendingApprovals || 0) + (activeAlerts || 0) + (pendingAdjustments || 0)
      };

      return counts;
    },
    enabled: !!activeCompanyId,
    refetchInterval: 60000, // Refetch every minute as backup
  });

  // Set up realtime subscriptions
  useEffect(() => {
    if (!activeCompanyId) return;

    const channel = supabase
      .channel('header-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'budget_submissions' },
        () => queryClient.invalidateQueries({ queryKey: ['header-notifications'] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alert_history' },
        () => queryClient.invalidateQueries({ queryKey: ['header-notifications'] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'collective_salary_adjustments' },
        () => queryClient.invalidateQueries({ queryKey: ['header-notifications'] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeCompanyId, queryClient]);

  return {
    ...query.data || { pendingApprovals: 0, activeAlerts: 0, pendingAdjustments: 0, total: 0 },
    isLoading: query.isLoading,
  };
};
