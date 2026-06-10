import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Nr1Plan {
  id: string;
  name: string;
  description: string | null;
  monthly_price: number;
  annual_price: number;
  max_employees: number | null;
  features: string[];
}

/** Map between NR1_TIERS.id (frontend) and subscription_plans.name (DB). */
export const NR1_TIER_NAME: Record<string, string> = {
  essencial: 'NR-1 Essencial',
  crescimento: 'NR-1 Crescimento',
  consolidacao: 'NR-1 Consolidação',
  performance: 'NR-1 Performance',
  corporate: 'NR-1 Corporate',
};

export const useNr1Plans = () => {
  return useQuery({
    queryKey: ['nr1-public-plans'],
    queryFn: async (): Promise<Nr1Plan[]> => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('id, name, description, monthly_price, annual_price, max_employees, features')
        .eq('plan_type', 'nr1')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return (data ?? []).map((p) => ({
        ...p,
        monthly_price: Number(p.monthly_price),
        annual_price: Number(p.annual_price),
        features: Array.isArray(p.features) ? (p.features as string[]) : [],
      }));
    },
    staleTime: 5 * 60_000,
  });
};

export const findNr1PlanIdByTier = (plans: Nr1Plan[] | undefined, tierId: string): string | null => {
  if (!plans) return null;
  const name = NR1_TIER_NAME[tierId];
  return plans.find((p) => p.name === name)?.id ?? null;
};
