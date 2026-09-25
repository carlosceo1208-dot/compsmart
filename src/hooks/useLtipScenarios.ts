import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InstrumentScenario {
  instrument: 'SOP' | 'RSU' | 'Phantom' | 'Partnership';
  bear: number;
  base: number;
  bull: number;
  dilution_pct: number;
  tax_treatment: 'mercantil' | 'remuneratorio';
  cash_impact: number;
}

const useLtipComparisons = () => {
  return useQuery({
    queryKey: ['ltip-scenario-comparisons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ltip_scenario_comparisons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
};

export const calculateInstrumentScenarios = (params: {
  grant_value: number;
  vesting_years: number;
  cliff_months: number;
  growth_rate: number;
  exercise_price_pct?: number;
}): InstrumentScenario[] => {
  const { grant_value, vesting_years, growth_rate } = params;
  const exercisePct = params.exercise_price_pct ?? 1.0;

  const projectValue = (rate: number) =>
    grant_value * Math.pow(1 + rate, vesting_years);

  const bearRate = growth_rate - 0.10;
  const bullRate = growth_rate + 0.15;

  const sopGain = (rate: number) => {
    const finalValue = projectValue(rate);
    const exerciseCost = grant_value * exercisePct;
    return Math.max(0, finalValue - exerciseCost);
  };

  return [
    {
      instrument: 'SOP',
      bear: sopGain(bearRate),
      base: sopGain(growth_rate),
      bull: sopGain(bullRate),
      dilution_pct: 2.5,
      tax_treatment: 'mercantil',
      cash_impact: 0,
    },
    {
      instrument: 'RSU',
      bear: projectValue(bearRate),
      base: projectValue(growth_rate),
      bull: projectValue(bullRate),
      dilution_pct: 2.5,
      tax_treatment: 'remuneratorio',
      cash_impact: 0,
    },
    {
      instrument: 'Phantom',
      bear: projectValue(bearRate) - grant_value,
      base: projectValue(growth_rate) - grant_value,
      bull: projectValue(bullRate) - grant_value,
      dilution_pct: 0,
      tax_treatment: 'remuneratorio',
      cash_impact: projectValue(growth_rate) - grant_value,
    },
    {
      instrument: 'Partnership',
      bear: projectValue(bearRate) * 0.85,
      base: projectValue(growth_rate) * 0.85,
      bull: projectValue(bullRate) * 0.85,
      dilution_pct: 1.5,
      tax_treatment: 'mercantil',
      cash_impact: 0,
    },
  ];
};

export const useSaveScenarioComparison = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      root_company_id: string;
      comparison_name: string;
      employee_id?: string;
      grant_value: number;
      vesting_years: number;
      cliff_months: number;
      growth_rate: number;
      scenarios: InstrumentScenario[];
      recommendation?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('ltip_scenario_comparisons')
        .insert({
          root_company_id: params.root_company_id,
          comparison_name: params.comparison_name,
          employee_id: params.employee_id,
          grant_value: params.grant_value,
          vesting_years: params.vesting_years,
          cliff_months: params.cliff_months,
          growth_rate: params.growth_rate,
          instruments_compared: params.scenarios.map(s => s.instrument),
          results: params.scenarios as any,
          recommendation: params.recommendation,
          created_by: user!.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ltip-scenario-comparisons'] }),
  });
};
