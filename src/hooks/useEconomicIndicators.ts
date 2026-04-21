import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EconomicIndicator {
  id: string;
  indicator_key: string;
  indicator_value: number;
  reference_date: string;
  metadata: any;
  source: string | null;
  fetched_at: string;
}

export const useEconomicIndicators = () => {
  return useQuery({
    queryKey: ['economic-indicators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('executive_dashboard_indicators')
        .select('*')
        .order('reference_date', { ascending: false })
        .limit(20);
      if (error) throw error;

      const map: Record<string, EconomicIndicator> = {};
      (data || []).forEach((row: any) => {
        if (!map[row.indicator_key]) map[row.indicator_key] = row;
      });
      return map;
    },
    staleTime: 1000 * 60 * 30,
  });
};

export const useRefreshIndicators = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-economic-indicators');
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['economic-indicators'] }),
  });
};
