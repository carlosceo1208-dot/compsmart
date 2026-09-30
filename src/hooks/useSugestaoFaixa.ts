import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { lerSugestaoFaixa, type SugestaoFaixa } from "@/lib/faixaContrato";

/**
 * Sugestão pontual via função do servidor talent-sugerir-faixa (única entrada; recusa auditada).
 * 200 com valores → preenche; 200 com nulos → vazio; 403 → erro (aviso na tela).
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
      const { data, error } = await supabase.functions.invoke("talent-sugerir-faixa", {
        body: { company: activeCompanyId, titulo, cbo, grade: p.grade.trim(), cargoId: p.cargoId },
      });
      if (error) throw error;
      return lerSugestaoFaixa(data);
    },
  });
};
