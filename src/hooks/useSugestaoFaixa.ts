import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";

export type FonteFaixa = "pesquisa de mercado" | "tabela salarial" | "dados da empresa";
export interface SugestaoFaixa { min: number; max: number; fonte: FonteFaixa }

/**
 * Sugestão pontual de faixa via RPC talent_sugerir_faixa (servidor valida RH/admin da empresa
 * e devolve só {min,max,fonte}). Recusa vira erro (nunca "sem faixa").
 */
export const useSugestaoFaixa = (p: { titulo: string; cbo: string; grade: string; cargoId: string | null }) => {
  const { activeCompanyId } = useCompanyContext();
  const titulo = p.titulo.trim();
  const cbo = p.cbo.replace(/\D/g, "");
  return useQuery({
    queryKey: ["sugestao-faixa", activeCompanyId, titulo.toLowerCase(), cbo, p.grade, p.cargoId],
    enabled: !!activeCompanyId && (titulo.length >= 2 || !!cbo),
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: async (): Promise<SugestaoFaixa | null> => {
      const { data, error } = await supabase.rpc("talent_sugerir_faixa" as never, {
        _company: activeCompanyId, _titulo: titulo, _cbo: cbo, _grade: p.grade.trim(), _cargo_id: p.cargoId, _pontos: null,
      } as never);
      if (error) throw error;
      return (data as SugestaoFaixa | null) ?? null;
    },
  });
};
