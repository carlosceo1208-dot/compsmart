import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TransportationCalculation {
  employee_discount: number;
  company_subsidy: number;
  total_cost: number;
}

export const useTransportationCalculator = (
  employeeId: string, 
  monthlyCost: number | null
) => {
  return useQuery({
    queryKey: ['transportation-benefit', employeeId, monthlyCost],
    queryFn: async (): Promise<TransportationCalculation | null> => {
      if (!employeeId || !monthlyCost || monthlyCost <= 0) return null;

      const { data, error } = await supabase.rpc('calculate_transportation_benefit', {
        p_employee_id: employeeId,
        p_monthly_cost: monthlyCost,
      });

      if (error) throw error;
      
      return data && data.length > 0 ? data[0] : null;
    },
    enabled: !!employeeId && !!monthlyCost && monthlyCost > 0,
    staleTime: 1000 * 60, // 1 minuto
  });
};
