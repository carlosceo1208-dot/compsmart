import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useBenefitsKPI = () => {
  return useQuery({
    queryKey: ['kpi-benefits'],
    queryFn: async () => {
      // Buscar total de benefícios ativos
      const { data: benefits, error: benefitsError } = await supabase
        .from('benefits')
        .select('value_per_employee')
        .eq('is_active', true);
      
      if (benefitsError) throw benefitsError;

      // Buscar total de funcionários ativos
      const { count: activeEmployees, error: employeesError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      if (employeesError) throw employeesError;

      const totalBenefitsPerEmployee = benefits.reduce(
        (sum, b) => sum + (b.value_per_employee || 0), 
        0
      );
      
      const totalMonthlyCost = totalBenefitsPerEmployee * (activeEmployees || 0);

      return {
        totalBenefits: benefits.length,
        monthlyCost: totalMonthlyCost,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};
