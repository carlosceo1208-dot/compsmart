import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBudgetKPIFromPlanning } from './useBudgetKPIFromPlanning';

interface UseBudgetKPIParams {
  unitId?: string | null;
}

export const useBudgetKPI = (params: UseBudgetKPIParams = {}) => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  // Tentar buscar do planejamento primeiro
  const planningQuery = useBudgetKPIFromPlanning({ 
    unitId: params.unitId, 
    fiscalYear: currentYear 
  });

  // Buscar do orçamento manual como fallback
  const manualQuery = useQuery({
    queryKey: ['kpi-budget-manual', params.unitId],
    queryFn: async () => {

      // Buscar orçamento do mês atual
      let budgetQuery = supabase
        .from('budget')
        .select('budgeted_salary, budgeted_headcount')
        .eq('fiscal_year', currentYear)
        .eq('month', currentMonth);

      if (params.unitId === null || params.unitId === undefined) {
        budgetQuery = budgetQuery.is('unit_id', null);
      } else {
        budgetQuery = budgetQuery.eq('unit_id', params.unitId);
      }

      const { data: budget, error: budgetError } = await budgetQuery.maybeSingle();
      
      if (budgetError) throw budgetError;

      // Buscar dados reais
      let salariesQuery = supabase
        .from('profiles')
        .select('salary')
        .eq('status', 'active')
        .not('employee_number', 'is', null)
        .not('salary', 'is', null);

      if (params.unitId) {
        salariesQuery = salariesQuery.eq('unit_id', params.unitId);
      }

      const { data: salaries, error: salariesError } = await salariesQuery;
      
      if (salariesError) throw salariesError;

      let employeesQuery = supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .not('employee_number', 'is', null);

      if (params.unitId) {
        employeesQuery = employeesQuery.eq('unit_id', params.unitId);
      }

      const { count: activeEmployees, error: employeesError } = await employeesQuery;
      
      if (employeesError) throw employeesError;

      const realSalary = salaries.reduce((sum, p) => sum + (p.salary || 0), 0);
      const realHeadcount = activeEmployees || 0;

      return {
        budgetedSalary: budget?.budgeted_salary || 0,
        realSalary,
        budgetedHeadcount: budget?.budgeted_headcount || 0,
        realHeadcount,
        salaryVariance: realSalary - (budget?.budgeted_salary || 0),
        headcountVariance: realHeadcount - (budget?.budgeted_headcount || 0),
        source: 'manual' as const,
        fiscalYear: currentYear,
      };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !planningQuery.data || planningQuery.data.budgetedSalary === 0,
  });

  // Priorizar dados do planejamento se existirem
  if (planningQuery.data && planningQuery.data.budgetedSalary > 0) {
    return {
      data: planningQuery.data,
      isLoading: planningQuery.isLoading,
      error: planningQuery.error,
    };
  }

  // Fallback para orçamento manual
  return {
    data: manualQuery.data,
    isLoading: manualQuery.isLoading,
    error: manualQuery.error,
  };
};
