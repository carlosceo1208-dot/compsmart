import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSubmissionStatus = (unitId: string | null, fiscalYear: number) => {
  return useQuery({
    queryKey: ['submission-status', unitId, fiscalYear],
    queryFn: async () => {
      if (!unitId) {
        return { status: 'draft', submission: null };
      }

      const { data, error } = await supabase
        .from('budget_submissions')
        .select('*')
        .eq('unit_id', unitId)
        .eq('fiscal_year', fiscalYear)
        .maybeSingle();

      if (error) throw error;
      
      return { 
        status: data?.status || 'draft',
        submission: data
      };
    },
    enabled: !!unitId,
  });
};
