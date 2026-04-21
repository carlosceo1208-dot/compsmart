import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DecisionScenario {
  id: string;
  scenario_name: string;
  description: string | null;
  strategy: string;
  multiplier: number;
  total_headcount: number;
  total_annual_impact: number;
  high_performers_retained: number;
  low_performers_included: number;
  payroll_increase_pct: number;
  is_active: boolean;
  created_at: string;
}

export const useDecisionScenarios = (rootCompanyId: string | null, fiscalYear: number) =>
  useQuery({
    queryKey: ['decision-scenarios', rootCompanyId, fiscalYear],
    enabled: !!rootCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('decision_scenarios' as never)
        .select('*')
        .eq('root_company_id', rootCompanyId!)
        .eq('fiscal_year', fiscalYear)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as DecisionScenario[];
    },
  });

export const useBuildScenario = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      root_company_id: string;
      fiscal_year: number;
      scenario_name: string;
      strategy?: string;
      multiplier?: number;
      filter_box_min?: number | null;
      filter_box_max?: number | null;
      filter_unit_ids?: string[] | null;
    }) => {
      const { data, error } = await supabase.rpc('build_scenario_from_9box', {
        p_root_company_id: input.root_company_id,
        p_fiscal_year: input.fiscal_year,
        p_scenario_name: input.scenario_name,
        p_strategy: input.strategy ?? 'balanced',
        p_multiplier: input.multiplier ?? 1.0,
        p_filter_box_min: input.filter_box_min ?? null,
        p_filter_box_max: input.filter_box_max ?? null,
        p_filter_unit_ids: input.filter_unit_ids ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Cenário criado');
      qc.invalidateQueries({ queryKey: ['decision-scenarios'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useCompareScenarios = (scenarioIds: string[]) =>
  useQuery({
    queryKey: ['compare-scenarios', scenarioIds],
    enabled: scenarioIds.length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('compare_scenarios', {
        p_scenario_ids: scenarioIds,
      });
      if (error) throw error;
      return data ?? [];
    },
  });

export const useSnapshotCycle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      root_company_id: string;
      fiscal_year: number;
      cycle_name: string;
      scenario_id: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase.rpc('snapshot_cycle_decision', {
        p_root_company_id: input.root_company_id,
        p_fiscal_year: input.fiscal_year,
        p_cycle_name: input.cycle_name,
        p_scenario_id: input.scenario_id,
        p_notes: input.notes ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Ciclo congelado para auditoria');
      qc.invalidateQueries({ queryKey: ['cycle-snapshots'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
