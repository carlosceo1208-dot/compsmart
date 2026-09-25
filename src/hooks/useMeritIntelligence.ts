import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MeritSuggestion {
  employee_id: string;
  current_salary: number;
  performance_score: number | null;
  range_position_percentage: number | null;
  suggested_merit_percentage: number;
  suggested_new_salary: number;
  monthly_impact: number;
  annual_impact: number;
  recommendation: string;
  is_mismatch: boolean;
  mismatch_reason: string | null;
}

export interface MismatchKPI {
  total_employees: number;
  high_perf_low_salary: number;
  low_perf_high_salary: number;
  total_mismatches: number;
  mismatch_percentage: number;
}

export interface TopMismatch {
  employee_id: string;
  full_name: string;
  job_title: string | null;
  performance_score: number | null;
  salary_range_percentage: number | null;
  mismatch_severity: 'crítico' | 'alto' | 'médio';
}

/**
 * Sugestão de mérito para um funcionário (matriz Performance × Faixa)
 */
function useMeritSuggestion(employeeId: string | null) {
  return useQuery({
    queryKey: ['merit-suggestion', employeeId],
    enabled: !!employeeId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_merit_suggestion', {
        p_employee_id: employeeId!,
      });
      if (error) throw error;
      return (data?.[0] ?? null) as MeritSuggestion | null;
    },
  });
}

/**
 * KPI agregado de incoerências performance × remuneração
 */
export function useCompensationMismatchKPI() {
  return useQuery({
    queryKey: ['compensation-mismatch-kpi'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_compensation_mismatch_kpi');
      if (error) throw error;
      return (data?.[0] ?? null) as MismatchKPI | null;
    },
  });
}

/**
 * Top funcionários com incoerência crítica
 */
export function useTopMismatches(limit = 5) {
  return useQuery({
    queryKey: ['top-mismatches', limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_top_compensation_mismatches', {
        p_limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as TopMismatch[];
    },
  });
}
