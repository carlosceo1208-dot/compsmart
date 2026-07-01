import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type InstrumentType =
  | 'stock_options'
  | 'rsu'
  | 'phantom_shares'
  | 'partnership'
  | 'performance_share'
  | 'previdencia'
  | 'bonus_diferido';

export interface LtipSimulation {
  id: string;
  scenario_name: string;
  instrument_type: InstrumentType;
  grant_value: number;
  current_share_price: number | null;
  exercise_price: number | null;
  num_shares: number | null;
  vesting_years: number;
  cliff_months: number;
  vesting_type: string;
  matching_percentage: number | null;
  employee_contribution_pct: number | null;
  projected_growth_rate: number;
  total_value_at_vest: number | null;
  dilution_percentage: number | null;
  tax_impact_estimated: number | null;
  tax_treatment: string | null;
  notes: string | null;
  created_at: string;
}

export interface SimulationInput {
  scenario_name: string;
  instrument_type: InstrumentType;
  grant_value: number;
  current_share_price?: number;
  exercise_price?: number;
  num_shares?: number;
  vesting_years: number;
  cliff_months: number;
  vesting_type: 'linear' | 'progressivo' | 'cliff_only';
  matching_percentage?: number;
  employee_contribution_pct?: number;
  projected_growth_rate: number;
  tax_treatment?: 'mercantil' | 'remuneratorio' | 'previdenciario';
  notes?: string;
  total_shares_outstanding?: number; // para calcular diluição
}

/**
 * Calcula o valor projetado no vest baseado no instrumento
 */
export function calculateLtipProjection(input: SimulationInput) {
  const growth = 1 + input.projected_growth_rate / 100;
  const yearsAfterCliff = input.vesting_years - input.cliff_months / 12;
  const compoundedGrowth = Math.pow(growth, input.vesting_years);

  let totalValue = 0;
  let dilution = 0;
  let taxImpact = 0;

  switch (input.instrument_type) {
    case 'stock_options': {
      const shares = input.num_shares ?? 0;
      const futurePrice = (input.current_share_price ?? 0) * compoundedGrowth;
      const intrinsic = Math.max(0, futurePrice - (input.exercise_price ?? 0));
      totalValue = intrinsic * shares;
      if (input.total_shares_outstanding) {
        dilution = (shares / input.total_shares_outstanding) * 100;
      }
      taxImpact = input.tax_treatment === 'mercantil' ? totalValue * 0.15 : totalValue * 0.275;
      break;
    }
    case 'rsu':
    case 'performance_share': {
      const shares = input.num_shares ?? 0;
      const futurePrice = (input.current_share_price ?? 0) * compoundedGrowth;
      totalValue = futurePrice * shares;
      if (input.total_shares_outstanding) {
        dilution = (shares / input.total_shares_outstanding) * 100;
      }
      taxImpact = totalValue * 0.275;
      break;
    }
    case 'phantom_shares': {
      const shares = input.num_shares ?? 0;
      const baselinePrice = input.current_share_price ?? 0;
      const futurePrice = baselinePrice * compoundedGrowth;
      totalValue = (futurePrice - baselinePrice) * shares;
      taxImpact = totalValue * 0.275; // remuneratório
      break;
    }
    case 'partnership': {
      // Desconto típico de 30% no preço, ganho de capital depois
      const shares = input.num_shares ?? 0;
      const futurePrice = (input.current_share_price ?? 0) * compoundedGrowth;
      totalValue = (futurePrice - (input.exercise_price ?? 0) * 0.7) * shares;
      if (input.total_shares_outstanding) {
        dilution = (shares / input.total_shares_outstanding) * 100;
      }
      taxImpact = totalValue * 0.15;
      break;
    }
    case 'previdencia': {
      // Aporte mensal × matching × juros compostos
      const empContrib = input.grant_value * (input.employee_contribution_pct ?? 6) / 100;
      const matching = empContrib * (input.matching_percentage ?? 100) / 100;
      const monthlyTotal = empContrib + matching;
      const months = input.vesting_years * 12;
      const monthlyRate = input.projected_growth_rate / 100 / 12;
      // FV anuidade
      totalValue = monthlyTotal * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
      taxImpact = 0; // dedutível para empresa, não tributado para colaborador no aporte
      break;
    }
    case 'bonus_diferido': {
      totalValue = input.grant_value * compoundedGrowth;
      taxImpact = totalValue * 0.275;
      break;
    }
  }

  return {
    total_value_at_vest: Number(totalValue.toFixed(2)),
    dilution_percentage: Number(dilution.toFixed(4)),
    tax_impact_estimated: Number(taxImpact.toFixed(2)),
    net_value: Number((totalValue - taxImpact).toFixed(2)),
  };
}

export function useLtipSimulations() {
  return useQuery({
    queryKey: ['ltip-simulations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('executive_ltip_simulations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as LtipSimulation[];
    },
  });
}

export function useCreateLtipSimulation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SimulationInput) => {
      const projection = calculateLtipProjection(input);
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('root_company_id')
        .eq('id', user!.id)
        .single();

      const { data, error } = await supabase
        .from('executive_ltip_simulations')
        .insert({
          root_company_id: profile!.root_company_id,
          created_by: user!.id,
          scenario_name: input.scenario_name,
          instrument_type: input.instrument_type,
          grant_value: input.grant_value,
          current_share_price: input.current_share_price,
          exercise_price: input.exercise_price,
          num_shares: input.num_shares,
          vesting_years: input.vesting_years,
          cliff_months: input.cliff_months,
          vesting_type: input.vesting_type,
          matching_percentage: input.matching_percentage,
          employee_contribution_pct: input.employee_contribution_pct,
          projected_growth_rate: input.projected_growth_rate,
          tax_treatment: input.tax_treatment,
          notes: input.notes,
          ...projection,
        } as never)

        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Simulação criada');
      qc.invalidateQueries({ queryKey: ['ltip-simulations'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteLtipSimulation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('executive_ltip_simulations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Simulação removida');
      qc.invalidateQueries({ queryKey: ['ltip-simulations'] });
    },
  });
}

export const INSTRUMENT_LABELS: Record<InstrumentType, string> = {
  stock_options: 'Stock Options (SOP)',
  rsu: 'RSU (Ações Restritas)',
  phantom_shares: 'Phantom Shares',
  partnership: 'Partnership',
  performance_share: 'Performance Share',
  previdencia: 'Previdência Corporativa',
  bonus_diferido: 'Bônus Diferido',
};
