import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useBenefitsKPI = () => {
  return useQuery({
    queryKey: ['kpi-benefits'],
    queryFn: async () => {
      // Buscar total de benefícios ativos
      const { data: benefits, error: benefitsError } = await supabase
        .from('benefits')
        .select('id, value_per_employee, is_active')
        .eq('is_active', true);
      
      if (benefitsError) throw benefitsError;

      // Buscar benefícios atribuídos aos funcionários ativos
      const { data: employeeBenefits, error: employeeBenefitsError } = await supabase
        .from('employee_benefits')
        .select(`
          company_contribution_value,
          employee_contribution_value,
          employee_contribution_type,
          employee_id,
          is_active
        `)
        .eq('is_active', true);
      
      if (employeeBenefitsError) throw employeeBenefitsError;

      // Buscar funcionários ativos para validar
      const { data: activeEmployees, error: employeesError } = await supabase
        .from('profiles')
        .select('id')
        .eq('status', 'active');
      
      if (employeesError) throw employeesError;

      const activeEmployeeIds = new Set(activeEmployees.map(e => e.id));

      // Calcular custo mensal total (apenas benefícios de funcionários ativos)
      const totalMonthlyCost = employeeBenefits
        .filter(eb => activeEmployeeIds.has(eb.employee_id))
        .reduce((sum, eb) => {
          return sum + (eb.company_contribution_value || 0);
        }, 0);

      return {
        totalBenefits: benefits.length,
        monthlyCost: totalMonthlyCost,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};
