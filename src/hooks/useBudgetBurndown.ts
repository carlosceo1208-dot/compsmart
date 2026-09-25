import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UnitBudgetStatus {
  unit_id: string;
  unit_name: string;
  fiscal_year: number;
  approved_amount_annual: number;
  reserved_amount: number;
  consumed_amount: number;
  available_amount: number;
  burn_pct: number;
  status: 'healthy' | 'warning' | 'critical' | 'exhausted' | 'no_budget';
  ledger_count: number;
}

export const useUnitBudgetStatus = (rootCompanyId: string | null, fiscalYear: number) =>
  useQuery({
    queryKey: ['unit-budget-status', rootCompanyId, fiscalYear],
    enabled: !!rootCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_unit_budget_status', {
        p_root_company_id: rootCompanyId!,
        p_fiscal_year: fiscalYear,
      });
      if (error) throw error;
      return (data ?? []) as unknown as UnitBudgetStatus[];
    },
  });

export const useUpsertUnitBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      root_company_id: string;
      unit_id: string;
      fiscal_year: number;
      approved_amount_annual: number;
      ceiling_pct?: number;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('unit_merit_budgets' as never)
        .upsert(input as never, { onConflict: 'unit_id,fiscal_year' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Orçamento atualizado');
      qc.invalidateQueries({ queryKey: ['unit-budget-status'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
