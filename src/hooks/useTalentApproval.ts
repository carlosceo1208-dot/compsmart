import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BudgetSimRow {
  unit_id: string;
  unit_name: string;
  headcount: number;
  current_payroll_annual: number;
  proposed_merit_impact_annual: number;
  payroll_increase_pct: number;
  ceiling_pct: number;
  ceiling_amount_annual: number;
  excess_annual: number;
  status: 'dentro' | 'atenção' | 'estouro' | 'sem dados';
  avg_box_position: number | null;
  high_performers: number;
  low_performers: number;
}

export const use9BoxBudgetSimulation = (
  rootCompanyId: string | null,
  fiscalYear: number,
  ceilingPct: number,
  enabled = true
) =>
  useQuery({
    queryKey: ['9box-budget-sim', rootCompanyId, fiscalYear, ceilingPct],
    enabled: enabled && !!rootCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('simulate_9box_budget', {
        p_root_company_id: rootCompanyId!,
        p_fiscal_year: fiscalYear,
        p_ceiling_pct: ceilingPct,
      });
      if (error) throw error;
      return (data ?? []) as unknown as BudgetSimRow[];
    },
  });

export interface TalentRecHistory {
  id: string;
  recommendation_id: string;
  action: 'created' | 'submitted' | 'approved' | 'rejected' | 'applied' | 'edited' | 'reverted';
  actor_id: string;
  previous_status: string | null;
  new_status: string | null;
  notes: string | null;
  created_at: string;
}

export const useTalentRecommendationHistory = (recommendationId: string | null) =>
  useQuery({
    queryKey: ['talent-rec-history', recommendationId],
    enabled: !!recommendationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('talent_recommendation_history' as never)
        .select('*')
        .eq('recommendation_id', recommendationId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as TalentRecHistory[];
    },
  });

export interface UpdateTalentStatusInput {
  recommendation_id: string;
  new_status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'applied';
  notes?: string;
}

export const useUpdateTalentRecommendationStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateTalentStatusInput) => {
      const { data: userData } = await supabase.auth.getUser();
      const patch: Record<string, unknown> = {
        status: input.new_status,
        approver_notes: input.notes ?? null,
      };
      if (input.new_status === 'submitted') {
        patch.submitted_by = userData.user?.id;
        patch.submitted_at = new Date().toISOString();
      }
      if (input.new_status === 'approved' || input.new_status === 'rejected') {
        patch.reviewed_by = userData.user?.id;
        patch.reviewed_at = new Date().toISOString();
      }
      if (input.new_status === 'applied') {
        patch.applied_at = new Date().toISOString();
      }
      const { data, error } = await supabase
        .from('talent_intelligence_recommendations' as never)
        .update(patch as never)
        .eq('id', input.recommendation_id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['talent-intelligence-dashboard'] });
      qc.invalidateQueries({ queryKey: ['talent-rec-history'] });
      qc.invalidateQueries({ queryKey: ['9box-budget-sim'] });
      const labels: Record<string, string> = {
        draft: 'Movido para rascunho',
        submitted: 'Enviado para aprovação',
        approved: 'Aprovado',
        rejected: 'Rejeitado',
        applied: 'Aplicado',
      };
      toast.success(labels[vars.new_status] ?? 'Status atualizado');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
