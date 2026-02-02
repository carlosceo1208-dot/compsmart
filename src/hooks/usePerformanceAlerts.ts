import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

export type AlertSeverity = 'attention' | 'neutral' | 'positive';

export interface PerformanceAlert {
  id: string;
  root_company_id: string;
  employee_id: string | null;
  alert_type: string;
  severity: AlertSeverity;
  title: string;
  message: string | null;
  context: Record<string, unknown>;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  employee?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    job_title: string | null;
  };
}

export interface AlertSummary {
  total: number;
  attention: number;
  neutral: number;
  positive: number;
  unresolved: number;
}

export const usePerformanceAlerts = () => {
  const { activeCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading, error } = useQuery({
    queryKey: ['performance-alerts', activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return [];
      
      const { data, error } = await supabase
        .from('performance_alerts')
        .select(`
          *,
          employee:profiles!performance_alerts_employee_id_fkey(
            id, full_name, avatar_url, job_title
          )
        `)
        .eq('root_company_id', activeCompanyId)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as PerformanceAlert[];
    },
    enabled: !!activeCompanyId,
  });

  const summary: AlertSummary = {
    total: alerts.length,
    attention: alerts.filter(a => a.severity === 'attention' && !a.is_resolved).length,
    neutral: alerts.filter(a => a.severity === 'neutral' && !a.is_resolved).length,
    positive: alerts.filter(a => a.severity === 'positive' && !a.is_resolved).length,
    unresolved: alerts.filter(a => !a.is_resolved).length,
  };

  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { error } = await supabase
        .from('performance_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
        })
        .eq('id', alertId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-alerts'] });
      toast.success('Alerta resolvido com sucesso');
    },
    onError: (error) => {
      console.error('Error resolving alert:', error);
      toast.error('Erro ao resolver alerta');
    },
  });

  return {
    alerts,
    summary,
    isLoading,
    error,
    resolveAlert: resolveAlert.mutate,
  };
};
