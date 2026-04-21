import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BudgetScenario {
  scenario: string;
  multiplier: number;
  total_employees: number;
  total_current_payroll: number;
  total_merit_impact_monthly: number;
  total_merit_impact_annual: number;
  avg_merit_pct: number;
  payroll_increase_pct: number;
}

export interface BudgetCeilingCheck {
  scenario: string;
  payroll_increase_pct: number;
  ceiling_pct: number;
  status: 'dentro' | 'atenção' | 'estouro';
  excess_annual: number;
}

export const useBudgetScenarios = (
  unitId: string | null,
  fiscalYear: number,
  enabled = true
) => {
  return useQuery({
    queryKey: ['budget-scenarios', unitId, fiscalYear],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('simulate_budget_scenarios', {
        p_unit_id: unitId,
        p_fiscal_year: fiscalYear,
      });
      if (error) throw error;
      return (data || []) as BudgetScenario[];
    },
    enabled,
  });
};

export const useBudgetCeilingCheck = (
  unitId: string | null,
  fiscalYear: number,
  ceilingPct: number,
  enabled = true
) => {
  return useQuery({
    queryKey: ['budget-ceiling', unitId, fiscalYear, ceilingPct],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_budget_ceiling', {
        p_unit_id: unitId,
        p_fiscal_year: fiscalYear,
        p_ceiling_pct: ceilingPct,
      });
      if (error) throw error;
      return (data || []) as BudgetCeilingCheck[];
    },
    enabled,
  });
};
