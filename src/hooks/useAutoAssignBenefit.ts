import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EligibilityResult {
  rule_id: string | null;
  is_eligible: boolean;
  company_value: number;
  employee_contribution_type: string;
  employee_contribution_value: number;
  description: string;
}

export const useAutoAssignBenefit = (employeeId: string, benefitId: string) => {
  return useQuery({
    queryKey: ['benefit-eligibility', employeeId, benefitId],
    queryFn: async (): Promise<EligibilityResult | null> => {
      if (!employeeId || !benefitId) return null;

      const { data, error } = await supabase.rpc('check_employee_eligibility', {
        p_employee_id: employeeId,
        p_benefit_id: benefitId,
      });

      if (error) throw error;
      
      // Retorna a primeira regra aplicável ou null se não for elegível
      return data && data.length > 0 ? data[0] : null;
    },
    enabled: !!employeeId && !!benefitId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
