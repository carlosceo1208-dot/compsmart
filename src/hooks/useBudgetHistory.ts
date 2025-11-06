import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BudgetHistoryParams {
  fiscalYear?: number;
  month?: number | null;
  unitId?: string | null;
}

export const useBudgetHistory = (params: BudgetHistoryParams = {}) => {
  return useQuery({
    queryKey: ['budget-history', params],
    queryFn: async () => {
      let query = supabase
        .from('budget')
        .select(`
          *,
          organizational_structure:unit_id (
            id,
            description,
            type
          )
        `)
        .order('fiscal_year', { ascending: false })
        .order('month', { ascending: false });

      if (params.fiscalYear) {
        query = query.eq('fiscal_year', params.fiscalYear);
      }

      if (params.month !== undefined && params.month !== null) {
        query = query.eq('month', params.month);
      }

      if (params.unitId === null) {
        query = query.is('unit_id', null);
      } else if (params.unitId) {
        query = query.eq('unit_id', params.unitId);
      }

      const { data: budgets, error: budgetError } = await query;
      if (budgetError) throw budgetError;

      // Para cada orçamento, buscar dados reais
      const budgetsWithReal = await Promise.all(
        (budgets || []).map(async (budget) => {
          // Buscar salários reais
          let salaryQuery = supabase
            .from('profiles')
            .select('salary')
            .eq('status', 'active')
            .not('salary', 'is', null);

          if (budget.unit_id) {
            salaryQuery = salaryQuery.eq('unit_id', budget.unit_id);
          }

          const { data: salaries } = await salaryQuery;
          const realSalary = salaries?.reduce((sum, p) => sum + (p.salary || 0), 0) || 0;

          // Buscar headcount real
          let headcountQuery = supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

          if (budget.unit_id) {
            headcountQuery = headcountQuery.eq('unit_id', budget.unit_id);
          }

          const { count: realHeadcount } = await headcountQuery;

          return {
            ...budget,
            realSalary,
            realHeadcount: realHeadcount || 0,
            salaryVariance: realSalary - budget.budgeted_salary,
            headcountVariance: (realHeadcount || 0) - budget.budgeted_headcount,
          };
        })
      );

      return budgetsWithReal;
    },
    staleTime: 2 * 60 * 1000,
  });
};
