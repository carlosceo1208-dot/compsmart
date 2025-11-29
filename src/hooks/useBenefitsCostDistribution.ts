import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BenefitCostDistribution {
  name: string;
  companyPercent: number;
  employeePercent: number;
  companyCost: number;
  employeeCost: number;
  totalCost: number;
}

export const useBenefitsCostDistribution = () => {
  return useQuery({
    queryKey: ['benefits-cost-distribution'],
    queryFn: async () => {
      // Buscar benefícios ativos
      const { data: benefits, error: benefitsError } = await supabase
        .from('benefits')
        .select('id, name')
        .eq('is_active', true);
      
      if (benefitsError) throw benefitsError;

      // Buscar atribuições ativas
      const { data: employeeBenefits, error: ebError } = await supabase
        .from('employee_benefits')
        .select(`
          benefit_id,
          company_contribution_value,
          employee_contribution_value,
          employee_contribution_type,
          employee_id
        `)
        .eq('is_active', true);
      
      if (ebError) throw ebError;

      // Buscar funcionários ativos
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

      // Agrupar por benefício e calcular custos
      const benefitCosts = new Map<string, { companyCost: number; employeeCost: number }>();

      for (const eb of activeBenefits) {
        const current = benefitCosts.get(eb.benefit_id) || { companyCost: 0, employeeCost: 0 };
        
        // Custo da empresa
        current.companyCost += eb.company_contribution_value || 0;
        
        // Custo do funcionário
        let empContribution = 0;
        if (eb.employee_contribution_type === 'percentage') {
          empContribution = (eb.company_contribution_value * (eb.employee_contribution_value || 0)) / 100;
        } else if (eb.employee_contribution_type === 'fixed') {
          empContribution = eb.employee_contribution_value || 0;
        }
        current.employeeCost += empContribution;
        
        benefitCosts.set(eb.benefit_id, current);
      }

      // Construir resultado final
      const result: BenefitCostDistribution[] = [];

      for (const benefit of benefits) {
        const costs = benefitCosts.get(benefit.id);
        if (!costs || (costs.companyCost === 0 && costs.employeeCost === 0)) continue;

        const totalCost = costs.companyCost + costs.employeeCost;
        
        result.push({
          name: benefit.name,
          companyPercent: totalCost > 0 ? (costs.companyCost / totalCost) * 100 : 100,
          employeePercent: totalCost > 0 ? (costs.employeeCost / totalCost) * 100 : 0,
          companyCost: costs.companyCost,
          employeeCost: costs.employeeCost,
          totalCost,
        });
      }

      // Ordenar por custo total decrescente
      return result.sort((a, b) => b.totalCost - a.totalCost);
    },
    staleTime: 5 * 60 * 1000,
  });
};
