import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GateWarning {
  code: string;
  severity: 'medium' | 'high' | 'critical';
  message: string;
}

export interface GovernanceEvaluation {
  warnings: GateWarning[];
  is_blocked: boolean;
  requires_override: boolean;
  can_submit: boolean;
}

export interface MeritApprovalRequest {
  id: string;
  root_company_id: string;
  employee_id: string;
  unit_id: string | null;
  fiscal_year: number;
  box_position: number | null;
  performance_score: number | null;
  current_salary: number;
  compa_ratio: number | null;
  range_position_pct: number | null;
  months_since_last_raise: number | null;
  suggested_merit_pct: number;
  requested_merit_pct: number;
  new_salary: number;
  monthly_impact: number;
  annual_impact: number;
  budget_available_pct: number | null;
  budget_remaining_annual: number | null;
  budget_after_request: number | null;
  justification: string;
  override_reason: string | null;
  gate_warnings: GateWarning[];
  is_blocked: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'applied';
  requested_by: string;
  approver_id: string | null;
  approval_notes: string | null;
  reviewed_at: string | null;
  applied_at: string | null;
  applied_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeritApprovalHistoryItem {
  id: string;
  request_id: string;
  action: 'created' | 'approved' | 'rejected' | 'cancelled' | 'applied' | 'edited';
  actor_id: string;
  previous_status: string | null;
  new_status: string | null;
  notes: string | null;
  snapshot: unknown;
  created_at: string;
}

export interface EvaluateGovernanceInput {
  employee_id: string;
  requested_pct: number;
  suggested_pct: number;
  compa_ratio?: number | null;
  months_since_last_raise?: number | null;
  budget_available_pct?: number | null;
  annual_impact: number;
  budget_remaining_annual?: number | null;
}

const useEvaluateGovernance = () =>
  useMutation({
    mutationFn: async (input: EvaluateGovernanceInput): Promise<GovernanceEvaluation> => {
      const { data, error } = await supabase.rpc('evaluate_merit_governance', {
        p_employee_id: input.employee_id,
        p_requested_pct: input.requested_pct,
        p_suggested_pct: input.suggested_pct,
        p_compa_ratio: input.compa_ratio ?? null,
        p_months_since_last_raise: input.months_since_last_raise ?? null,
        p_budget_available_pct: input.budget_available_pct ?? null,
        p_annual_impact: input.annual_impact,
        p_budget_remaining_annual: input.budget_remaining_annual ?? null,
      });
      if (error) throw error;
      return data as unknown as GovernanceEvaluation;
    },
  });

export const useMeritApprovalRequests = (status?: MeritApprovalRequest['status']) =>
  useQuery({
    queryKey: ['merit-approval-requests', status ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('merit_approval_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as MeritApprovalRequest[];
    },
  });

export const useMeritApprovalHistory = (requestId: string | null) =>
  useQuery({
    queryKey: ['merit-approval-history', requestId],
    enabled: !!requestId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merit_approval_history')
        .select('*')
        .eq('request_id', requestId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as MeritApprovalHistoryItem[];
    },
  });

export type CreateMeritRequestInput = Omit<
  MeritApprovalRequest,
  | 'id'
  | 'status'
  | 'approver_id'
  | 'approval_notes'
  | 'reviewed_at'
  | 'applied_at'
  | 'applied_by'
  | 'created_at'
  | 'updated_at'
>;

const useCreateMeritRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateMeritRequestInput) => {
      const { data, error } = await supabase
        .from('merit_approval_requests')
        .insert(input as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['merit-approval-requests'] });
      toast.success('Solicitação de mérito enviada para aprovação');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useReviewMeritRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      decision: 'approved' | 'rejected';
      notes: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('merit_approval_requests')
        .update({
          status: params.decision,
          approver_id: userData.user?.id,
          approval_notes: params.notes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', params.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['merit-approval-requests'] });
      qc.invalidateQueries({ queryKey: ['merit-approval-history'] });
      toast.success(vars.decision === 'approved' ? 'Solicitação aprovada' : 'Solicitação rejeitada');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useCancelMeritRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('merit_approval_requests')
        .update({ status: 'cancelled' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['merit-approval-requests'] });
      toast.success('Solicitação cancelada');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
