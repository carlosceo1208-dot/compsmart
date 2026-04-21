import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ApprovalInboxItem {
  assignment_id: string;
  approval_type: 'merit' | 'talent';
  source_id: string;
  employee_name: string;
  requested_pct: number | null;
  annual_impact: number | null;
  assigned_at: string;
  deadline_at: string;
  hours_remaining: number;
  is_overdue: boolean;
  status: string;
  escalated: boolean;
}

export const useApprovalInbox = () =>
  useQuery({
    queryKey: ['approval-inbox'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_approval_inbox');
      if (error) throw error;
      return (data ?? []) as unknown as ApprovalInboxItem[];
    },
    refetchInterval: 60_000,
  });

export interface SlaConfig {
  id?: string;
  root_company_id: string;
  approval_type: 'merit' | 'talent' | 'all';
  sla_business_days: number;
  reminder_days_before: number[];
  escalate_to_superior: boolean;
  escalate_after_days: number;
  notify_email: boolean;
}

export const useSlaConfig = (rootCompanyId: string | null) =>
  useQuery({
    queryKey: ['sla-config', rootCompanyId],
    enabled: !!rootCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('approval_sla_config' as never)
        .select('*')
        .eq('root_company_id', rootCompanyId!);
      if (error) throw error;
      return (data ?? []) as unknown as SlaConfig[];
    },
  });

export const useUpsertSlaConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SlaConfig) => {
      const { error } = await supabase
        .from('approval_sla_config' as never)
        .upsert(input as never, { onConflict: 'root_company_id,approval_type' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Configuração de SLA salva');
      qc.invalidateQueries({ queryKey: ['sla-config'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useEscalateOverdue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('escalate_overdue_approvals');
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      const count = data?.[0]?.escalated_count ?? 0;
      toast.success(`${count} aprovações escaladas`);
      qc.invalidateQueries({ queryKey: ['approval-inbox'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
