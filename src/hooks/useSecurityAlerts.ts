import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: string;
  source_ip: string | null;
  target_email: string | null;
  company_id: string | null;
  details: Record<string, unknown> | null;
  status: string;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

export function useSecurityAlerts(status?: string) {
  return useQuery({
    queryKey: ['security-alerts', status],
    queryFn: async () => {
      let query = supabase
        .from('security_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as SecurityAlert[];
    },
    refetchInterval: 15000, // Refresh every 15 seconds
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('security_alerts')
        .update({
          status: 'acknowledged',
          acknowledged_by: user.user.id,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['security-dashboard'] });
      toast.success('Alerta reconhecido');
    },
    onError: (error) => {
      toast.error('Erro ao reconhecer alerta: ' + error.message);
    }
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ alertId, notes }: { alertId: string; notes?: string }) => {
      const { error } = await supabase
        .from('security_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolution_notes: notes || null
        })
        .eq('id', alertId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['security-dashboard'] });
      toast.success('Alerta resolvido');
    },
    onError: (error) => {
      toast.error('Erro ao resolver alerta: ' + error.message);
    }
  });
}
