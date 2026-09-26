import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";

const norm = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
const round = (n: number) => Math.round(n);

export interface SugestaoFaixa { min: number; max: number; fonte: "pesquisa" | "tabela" }

/**
 * Sugere faixa salarial para a vaga: 1) pesquisa salarial ativa da empresa (Q1–Q3),
 * casando por CBO e depois por título, preferindo a mesma grade; 2) faixa da tabela
 * salarial do cargo da biblioteca. Sem dado → null (nunca inventa valor).
 */
export const useSugestaoFaixa = (p: { titulo: string; cbo: string; grade: string; cargoId: string | null }) => {
  const { activeCompanyId } = useCompanyContext();
  const titulo = norm(p.titulo);
  return useQuery({
    queryKey: ["sugestao-faixa", activeCompanyId, titulo, p.cbo, p.grade, p.cargoId],
    enabled: !!activeCompanyId && (titulo.length >= 2 || !!p.cbo),
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<SugestaoFaixa | null> => {
      let grade = p.grade.trim();
      let rangeId: string | null = null;
      if (p.cargoId) {
        const { data: jt } = await supabase.from("job_titles").select("grade, salary_range_id")
          .eq("id", p.cargoId).eq("root_company_id", activeCompanyId!).maybeSingle();
        if (jt) { grade = grade || jt.grade || ""; rangeId = jt.salary_range_id; }
      }
      const { data: rows } = await supabase.from("survey_data")
        .select("job_title, job_code, grade, q1_value, q3_value, survey_tables!inner(root_company_id, is_active)")
        .eq("survey_tables.root_company_id", activeCompanyId!).eq("survey_tables.is_active", true)
        .limit(2000);
      const lista = rows ?? [];
      const porCbo = p.cbo ? lista.filter((r) => r.job_code && r.job_code.replace(/\D/g, "") === p.cbo.replace(/\D/g, "")) : [];
      const candidatos = porCbo.length ? porCbo : lista.filter((r) => titulo && norm(r.job_title) === titulo);
      const mesmaGrade = grade ? candidatos.filter((r) => norm(r.grade) === norm(grade)) : [];
      const r = (mesmaGrade.length ? mesmaGrade : candidatos)[0];
      if (r && r.q1_value > 0 && r.q3_value > 0) return { min: round(r.q1_value), max: round(r.q3_value), fonte: "pesquisa" };
      if (rangeId) {
        const { data: sr } = await supabase.from("salary_ranges").select("min_value, max_value").eq("id", rangeId).maybeSingle();
        if (sr && sr.min_value > 0 && sr.max_value > 0) return { min: round(sr.min_value), max: round(sr.max_value), fonte: "tabela" };
      }
      return null;
    },
  });
};
