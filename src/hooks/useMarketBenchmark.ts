import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MarketCompetitivenessRow {
  employee_id: string;
  employee_name: string;
  job_title: string;
  grade: string;
  unit_id: string | null;
  unit_name: string | null;
  internal_salary: number;
  market_median: number;
  market_q1: number;
  market_q3: number;
  competitiveness_pct: number;
  market_position: "below_market" | "competitive_low" | "competitive_high" | "above_market";
  survey_name: string;
}

export interface MarketAlertRow {
  employee_id: string;
  employee_name: string;
  job_title: string;
  grade: string;
  internal_salary: number;
  market_median: number;
  gap_pct: number;
  gap_amount: number;
  severity: "critical" | "high" | "medium" | "low";
  recommendation: string;
}

export interface MarketBenchmarkSummary {
  total_matched: number;
  below_market: number;
  competitive: number;
  above_market: number;
  avg_competitiveness_pct: number;
  total_gap_amount: number;
  critical_alerts: number;
}

export function useMarketCompetitiveness() {
  return useQuery({
    queryKey: ["market-competitiveness"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_market_competitiveness");
      if (error) throw error;
      return (data ?? []) as MarketCompetitivenessRow[];
    },
  });
}

export function useMarketAlerts(thresholdPct = 15) {
  return useQuery({
    queryKey: ["market-alerts", thresholdPct],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_market_alerts", {
        threshold_pct: thresholdPct,
      });
      if (error) throw error;
      return (data ?? []) as MarketAlertRow[];
    },
  });
}

export function useMarketBenchmarkSummary() {
  return useQuery({
    queryKey: ["market-benchmark-summary"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_market_benchmark_summary");
      if (error) throw error;
      return (data?.[0] ?? null) as MarketBenchmarkSummary | null;
    },
  });
}
