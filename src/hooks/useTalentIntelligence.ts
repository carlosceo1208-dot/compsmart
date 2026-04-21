import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TalentIntelRow {
  employee_id: string;
  full_name: string | null;
  job_title: string | null;
  grade: string | null;
  current_salary: number | null;
  unit_id: string | null;
  root_company_id: string | null;
  evaluation_id: string | null;
  cycle_id: string | null;
  performance_score: number | null;
  potential_score: number | null;
  box_position: number | null;
  suggested_merit_pct: number | null;
  recommendation_id: string | null;
  recommendation_status: string | null;
  recommended_merit_pct: number | null;
  recommended_new_salary: number | null;
  financial_impact_annual: number | null;
}

export const BOX_LABELS: Record<number, { label: string; color: string }> = {
  9: { label: 'Star Talent', color: 'bg-emerald-500' },
  8: { label: 'High Potential', color: 'bg-emerald-400' },
  7: { label: 'Strong Contributor', color: 'bg-green-400' },
  6: { label: 'Solid Performer', color: 'bg-yellow-400' },
  5: { label: 'Core Employee', color: 'bg-yellow-300' },
  4: { label: 'Inconsistent', color: 'bg-orange-300' },
  3: { label: 'Effective', color: 'bg-orange-400' },
  2: { label: 'Underperformer', color: 'bg-red-400' },
  1: { label: 'Action Needed', color: 'bg-red-500' },
};

export function useTalentIntelligenceDashboard() {
  return useQuery({
    queryKey: ['talent-intelligence-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_talent_intelligence_dashboard' as any)
        .select('*')
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as TalentIntelRow[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useGenerateTalentRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: TalentIntelRow) => {
      if (!row.box_position || !row.current_salary) {
        throw new Error('Funcionário sem avaliação ou salário definido');
      }
      const meritPct = row.suggested_merit_pct ?? 0;
      const newSalary = row.current_salary * (1 + meritPct / 100);
      const monthlyImpact = newSalary - row.current_salary;
      const annualImpact = monthlyImpact * 13.33; // 12 + 13º + férias

      const { data, error } = await supabase
        .from('talent_intelligence_recommendations')
        .insert({
          employee_id: row.employee_id,
          cycle_id: row.cycle_id,
          root_company_id: row.root_company_id!,
          box_position: row.box_position,
          performance_score: row.performance_score,
          potential_score: row.potential_score,
          current_salary: row.current_salary,
          recommended_merit_pct: meritPct,
          recommended_new_salary: newSalary,
          financial_impact_monthly: monthlyImpact,
          financial_impact_annual: annualImpact,
          recommended_promotion: row.box_position >= 8,
          ai_reasoning: `Posição 9Box: ${row.box_position} (${BOX_LABELS[row.box_position]?.label}). Mérito sugerido: ${meritPct}% baseado na matriz Performance × Potencial.`,
          status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Recomendação gerada com sucesso');
      qc.invalidateQueries({ queryKey: ['talent-intelligence-dashboard'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateRecommendationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      status: 'approved' | 'rejected' | 'applied';
      manual_override_pct?: number;
      override_justification?: string;
    }) => {
      const updates: any = {
        status: params.status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: (await supabase.auth.getUser()).data.user?.id,
      };
      if (params.manual_override_pct !== undefined) {
        updates.manual_override_pct = params.manual_override_pct;
        updates.override_justification = params.override_justification;
      }
      if (params.status === 'applied') updates.applied_at = new Date().toISOString();

      const { error } = await supabase
        .from('talent_intelligence_recommendations')
        .update(updates)
        .eq('id', params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status atualizado');
      qc.invalidateQueries({ queryKey: ['talent-intelligence-dashboard'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useTalentKPIs() {
  return useQuery({
    queryKey: ['talent-kpis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_talent_intelligence_dashboard' as any)
        .select('box_position, financial_impact_annual, recommendation_status');
      if (error) throw error;
      const rows = (data ?? []) as any[];
      const stars = rows.filter((r) => (r.box_position ?? 0) >= 8).length;
      const action = rows.filter((r) => (r.box_position ?? 0) <= 2).length;
      const totalImpact = rows.reduce((sum, r) => sum + Number(r.financial_impact_annual ?? 0), 0);
      const pending = rows.filter((r) => r.recommendation_status === 'pending').length;
      return { total: rows.length, stars, action, totalImpact, pending };
    },
    staleTime: 5 * 60 * 1000,
  });
}
