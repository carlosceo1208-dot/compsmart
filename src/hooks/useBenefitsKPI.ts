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

      // Filtrar apenas benefícios de funcionários ativos
      const activeBenefits = employeeBenefits.filter(eb => 
        activeEmployeeIds.has(eb.employee_id)
      );

      // Calcular custo da empresa
      const companyCost = activeBenefits.reduce((sum, eb) => {
        return sum + (eb.company_contribution_value || 0);
      }, 0);

      // Calcular custo do funcionário
      const employeeCost = activeBenefits.reduce((sum, eb) => {
        let empContribution = 0;
        
        if (eb.employee_contribution_type === 'percentage') {
          // Percentual sobre o valor da empresa
          empContribution = (eb.company_contribution_value * (eb.employee_contribution_value || 0)) / 100;
        } else if (eb.employee_contribution_type === 'fixed') {
          // Valor fixo
          empContribution = eb.employee_contribution_value || 0;
        }
        // Se 'none', empContribution permanece 0
        
        return sum + empContribution;
      }, 0);

      // Calcular custo total
      const totalCost = companyCost + employeeCost;

      // Calcular quantidade de funcionários únicos com benefícios
      const employeesWithBenefits = new Set(
        activeBenefits.map(eb => eb.employee_id)
      ).size;

      // Calcular percentual de participação do funcionário
      const employeeCostPercentage = totalCost > 0 
        ? (employeeCost / totalCost) * 100 
        : 0;

      return {
        totalBenefits: benefits.length,
        totalCost,
        companyCost,
        employeeCost,
        employeesWithBenefits,
        employeeCostPercentage,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};
