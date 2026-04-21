import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PayGapByGender {
  gender: string;
  employee_count: number;
  avg_salary: number;
  median_salary: number;
  gap_vs_male_percentage: number | null;
}

export interface PayGapByGrade {
  grade: string;
  employee_count: number;
  min_salary: number;
  avg_salary: number;
  max_salary: number;
  std_deviation: number;
  coefficient_variation: number;
}

export interface SalaryGiniIndex {
  gini_index: number;
  total_employees: number;
  total_payroll: number;
  interpretation: string;
}

export interface EquityAlert {
  job_title: string;
  grade: string;
  employee_count: number;
  min_salary: number;
  max_salary: number;
  gap_percentage: number;
  severity: 'crítico' | 'alto' | 'médio';
}

export function usePayGapByGender() {
  return useQuery({
    queryKey: ['equity-pay-gap-gender'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pay_gap_by_gender');
      if (error) throw error;
      return (data ?? []) as PayGapByGender[];
    },
  });
}

export function usePayGapByGrade() {
  return useQuery({
    queryKey: ['equity-pay-gap-grade'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pay_gap_by_grade');
      if (error) throw error;
      return (data ?? []) as PayGapByGrade[];
    },
  });
}

export function useSalaryGiniIndex() {
  return useQuery({
    queryKey: ['equity-gini-index'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_salary_gini_index');
      if (error) throw error;
      return (data?.[0] ?? null) as SalaryGiniIndex | null;
    },
  });
}

export function useEquityAlerts(thresholdPct = 15) {
  return useQuery({
    queryKey: ['equity-alerts', thresholdPct],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_equity_alerts', {
        p_threshold_pct: thresholdPct,
      });
      if (error) throw error;
      return (data ?? []) as EquityAlert[];
    },
  });
}
