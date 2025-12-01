import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSubmissionStatus = (unitId: string | null, fiscalYear: number) => {
  return useQuery({
    queryKey: ['submission-status', unitId, fiscalYear],
    queryFn: async () => {
      let query = supabase
        .from('budget_submissions')
        .select('*')
        .eq('fiscal_year', fiscalYear);

      // CORREÇÃO: Suportar empresa toda (unit_id IS NULL)
      if (unitId === null) {
        query = query.is('unit_id', null);
      } else {
        query = query.eq('unit_id', unitId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      
      return { 
        status: data?.status || 'draft',
        submission: data
      };
    },
    // CORREÇÃO: Habilitar mesmo quando unitId é null
    enabled: true,
  });
};
