import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PublicPricingFaixa {
  slug: string;
  nome: string;
  min: number;
  max: number | null;
  sob_consulta: boolean;
}

export interface PublicPricing {
  moeda: string;
  preco_base_colaborador: number;
  desconto_modulo_adicional_pct: number;
  desconto_semestral_pct: number;
  desconto_anual_pct: number;
  faixas: PublicPricingFaixa[];
  modulos: {
    slug: string;
    nome: string;
    nome_agente: string | null;
    is_negotiable: boolean;
    is_legal_product: boolean;
    ordem: number;
  }[];
}

/**
 * Preços públicos da landing — lidos exclusivamente da função get_public_pricing(),
 * que não recebe nenhum parâmetro e devolve apenas valores públicos.
 * Nunca usar valores fixos nos componentes.
 */
export const usePublicPricing = () =>
  useQuery({
    queryKey: ["public-pricing"],
    staleTime: 1000 * 60 * 30,
    queryFn: async (): Promise<PublicPricing | null> => {
      const { data, error } = await supabase.rpc("get_public_pricing");
      if (error) throw error;
      if (!data) return null;
      const raw = data as unknown as PublicPricing;
      return {
        ...raw,
        preco_base_colaborador: Number(raw.preco_base_colaborador),
        desconto_modulo_adicional_pct: Number(raw.desconto_modulo_adicional_pct),
        desconto_semestral_pct: Number(raw.desconto_semestral_pct),
        desconto_anual_pct: Number(raw.desconto_anual_pct),
        faixas: raw.faixas ?? [],
        modulos: raw.modulos ?? [],
      };
    },
  });

export type BillingCycle = "mensal" | "semestral" | "anual";

export const cycleDiscountPct = (
  pricing: PublicPricing,
  cycle: BillingCycle,
): number => {
  if (cycle === "semestral") return pricing.desconto_semestral_pct;
  if (cycle === "anual") return pricing.desconto_anual_pct;
  return 0;
};

/** Preço por colaborador/mês do módulo adicional (derivado da base × desconto). */
export const additionalModulePrice = (pricing: PublicPricing): number =>
  pricing.preco_base_colaborador *
  (1 - pricing.desconto_modulo_adicional_pct / 100);

/**
 * Degrau fixo, não cumulativo: 1º módulo na base, cada módulo adicional com
 * o mesmo desconto de 50%.
 */
export const perEmployeePrice = (
  pricing: PublicPricing,
  modules: number,
): number => {
  const qty = Math.max(1, modules);
  return (
    pricing.preco_base_colaborador +
    (qty - 1) * additionalModulePrice(pricing)
  );
};

export const simulateMonthlyTotal = (
  pricing: PublicPricing,
  modules: number,
  employees: number,
  cycle: BillingCycle,
) => {
  const perEmployee = perEmployeePrice(pricing, modules);
  const gross = perEmployee * Math.max(1, employees);
  const discountPct = cycleDiscountPct(pricing, cycle);
  const total = gross * (1 - discountPct / 100);
  return { perEmployee, gross, discountPct, total };
};

export const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
