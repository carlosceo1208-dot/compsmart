import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useIncentivesKPI = () => {
  return useQuery({
    queryKey: ['kpi-incentives'],
    queryFn: async () => {
      // Buscar programas ativos
      const { data: programs, error: programsError } = await supabase
        .from('incentive_programs')
        .select('program_type, target_percentage')
        .eq('is_active', true);
      
      if (programsError) throw programsError;

      // Buscar massa salarial total
      const { data: salaries, error: salariesError } = await supabase
        .from('profiles')
        .select('salary')
        .eq('status', 'active')
        .not('salary', 'is', null);
      
      if (salariesError) throw salariesError;

      const totalSalary = salaries.reduce((sum, p) => sum + (p.salary || 0), 0);

      const shortTermPrograms = programs.filter(p => p.program_type === 'short_term');
      const longTermPrograms = programs.filter(p => p.program_type === 'long_term');

      const shortTermProvision = shortTermPrograms.reduce(
        (sum, p) => sum + (totalSalary * (p.target_percentage || 0) / 100),
        0
      );

      const longTermProvision = longTermPrograms.reduce(
        (sum, p) => sum + (totalSalary * (p.target_percentage || 0) / 100),
        0
      );

      return {
        shortTerm: shortTermProvision,
        longTerm: longTermProvision,
        total: shortTermProvision + longTermProvision,
        activePrograms: programs.length,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};
