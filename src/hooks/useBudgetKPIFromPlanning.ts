import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UseBudgetKPIFromPlanningParams {
  unitId?: string | null;
  fiscalYear?: number;
}

export const useBudgetKPIFromPlanning = (params: UseBudgetKPIFromPlanningParams = {}) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const fiscalYear = params.fiscalYear || currentYear;

  return useQuery({
    queryKey: ['kpi-budget-planning', params.unitId, fiscalYear, currentMonth],
    queryFn: async () => {
      // Buscar projeções do planejamento para o mês atual
      let planningQuery = supabase
        .from('budget_employee_projections')
        .select(`
          projected_fixed_salary,
          projected_variable_salary,
          is_active,
          employee_id,
          projected_unit_id
        `)
        .eq('fiscal_year', fiscalYear)
        .eq('month', currentMonth)
        .eq('is_active', true);

      if (params.unitId) {
        planningQuery = planningQuery.eq('projected_unit_id', params.unitId);
      }

      const { data: projections, error: projectionsError } = await planningQuery;
      
      if (projectionsError) throw projectionsError;

      // Calcular totais do planejamento
      const budgetedSalary = projections.reduce((sum, p) => 
        sum + (p.projected_fixed_salary || 0) + (p.projected_variable_salary || 0), 0
      );
      const budgetedHeadcount = projections.length;

      // Buscar dados reais (atual)
      let salariesQuery = supabase
        .from('profiles')
        .select('salary, variable_salary')
        .eq('status', 'active')
        .not('salary', 'is', null);

      if (params.unitId) {
        salariesQuery = salariesQuery.eq('unit_id', params.unitId);
      }

      const { data: salaries, error: salariesError } = await salariesQuery;
      
      if (salariesError) throw salariesError;

      let employeesQuery = supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (params.unitId) {
        employeesQuery = employeesQuery.eq('unit_id', params.unitId);
      }

      const { count: activeEmployees, error: employeesError } = await employeesQuery;
      
      if (employeesError) throw employeesError;

      const realSalary = salaries.reduce((sum, p) => 
        sum + (p.salary || 0) + (p.variable_salary || 0), 0
      );
      const realHeadcount = activeEmployees || 0;

      return {
        budgetedSalary,
        realSalary,
        budgetedHeadcount,
        realHeadcount,
        salaryVariance: realSalary - budgetedSalary,
        headcountVariance: realHeadcount - budgetedHeadcount,
        source: 'planning' as const,
        fiscalYear,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};
