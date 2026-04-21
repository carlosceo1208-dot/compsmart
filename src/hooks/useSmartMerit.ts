import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SmartMeritInput {
  box_position: number;
  compa_ratio?: number;
  months_since_last_raise?: number;
  budget_available_pct?: number;
}

export interface SmartMeritResult {
  base_pct: number;
  adjusted_pct: number;
  compa_factor: number;
  time_factor: number;
  budget_factor: number;
  warnings: string[];
  is_blocked: boolean;
}

export const useSmartMerit = () => {
  return useMutation({
    mutationFn: async (input: SmartMeritInput): Promise<SmartMeritResult> => {
      const { data, error } = await supabase.rpc('calculate_smart_merit', {
        p_box_position: input.box_position,
        p_compa_ratio: input.compa_ratio ?? 1.0,
        p_months_since_last_raise: input.months_since_last_raise ?? 12,
        p_budget_available_pct: input.budget_available_pct ?? 100.0,
      });
      if (error) throw error;
      return data as unknown as SmartMeritResult;
    },
  });
};
