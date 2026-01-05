import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";

export const useFounderStatus = () => {
  const { activeCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['founder-status', activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return false;

      const { data, error } = await supabase
        .from('organizational_structure')
        .select('is_founder')
        .eq('id', activeCompanyId)
        .single();

      if (error) {
        console.error('Error fetching founder status:', error);
        return false;
      }

      return data?.is_founder ?? false;
    },
    enabled: !!activeCompanyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
