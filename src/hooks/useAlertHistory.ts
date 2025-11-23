import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AlertHistory {
  id: string;
  root_company_id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  metric_value: number;
  threshold_value: number;
  context: any;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  email_sent: boolean;
  email_sent_at: string | null;
  email_recipients: string[];
  created_at: string;
}

export const useAlertHistory = (filters?: {
  status?: string;
  severity?: string;
  alertType?: string;
}) => {
  return useQuery({
    queryKey: ['alert-history', filters],
    queryFn: async () => {
      let query = supabase
        .from('alert_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters?.alertType) {
        query = query.eq('alert_type', filters.alertType);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as AlertHistory[];
    }
  });
};

export const useAcknowledgeAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('alert_history')
        .update({
          status: 'acknowledged',
          acknowledged_by: userData.user?.id,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-history'] });
      toast.success('Alerta reconhecido');
    },
    onError: (error) => {
      console.error('Error acknowledging alert:', error);
      toast.error('Erro ao reconhecer alerta');
    }
  });
};

export const useResolveAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data, error } = await supabase
        .from('alert_history')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-history'] });
      toast.success('Alerta resolvido');
    },
    onError: (error) => {
      console.error('Error resolving alert:', error);
      toast.error('Erro ao resolver alerta');
    }
  });
};
