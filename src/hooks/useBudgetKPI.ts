import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useBudgetKPI = () => {
  return useQuery({
    queryKey: ['kpi-budget'],
    queryFn: async () => {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // Buscar orçamento do mês atual
      const { data: budget, error: budgetError } = await supabase
        .from('budget')
        .select('budgeted_salary, budgeted_headcount')
        .eq('fiscal_year', currentYear)
        .eq('month', currentMonth)
        .maybeSingle();
      
      if (budgetError) throw budgetError;

      // Buscar dados reais
      const { data: salaries, error: salariesError } = await supabase
        .from('profiles')
        .select('salary')
        .eq('status', 'active')
        .not('salary', 'is', null);
      
      if (salariesError) throw salariesError;

      const { count: activeEmployees, error: employeesError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
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
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};
