import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";

const norm = (t: string | null | undefined) => (t ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
const digits = (t: string | null | undefined) => (t ?? "").replace(/\D/g, "");
const round = (n: number) => Math.round(n);

export interface SugestaoFaixa { min: number; max: number; fonte: "pesquisa" | "tabela"; base: string }

/** Retorna os itens com nome exato; senão o parcial só se houver UM único nome distinto (evita falso positivo). */
function casarPorNome<T>(lista: T[], nome: (r: T) => string, alvo: string): T[] {
  if (!alvo) return [];
  const exatos = lista.filter((r) => norm(nome(r)) === alvo);
  if (exatos.length) return exatos;
  const parciais = lista.filter((r) => { const n = norm(nome(r)); return n.length >= 3 && (n.includes(alvo) || alvo.includes(n)); });
  const nomes = new Set(parciais.map((r) => norm(nome(r))));
  return nomes.size === 1 ? parciais : [];
}

/**
 * Sugere faixa salarial para a vaga: 1) pesquisas salariais ativas (da empresa, depois globais), Q1–Q3,
 * casando por CBO e depois por título; 2) faixa da tabela salarial do cargo da biblioteca
 * (ligado ou encontrado por CBO/título). Sem dado ou ambíguo → null (nunca inventa valor).
 */
export const useSugestaoFaixa = (p: { titulo: string; cbo: string; grade: string; cargoId: string | null }) => {
  const { activeCompanyId } = useCompanyContext();
  const titulo = norm(p.titulo);
  const cbo = digits(p.cbo);
  return useQuery({
    queryKey: ["sugestao-faixa", activeCompanyId, titulo, cbo, p.grade, p.cargoId],
    enabled: !!activeCompanyId && (titulo.length >= 2 || !!cbo),
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<SugestaoFaixa | null> => {
      let grade = p.grade.trim();
      let rangeId: string | null = null;
      let baseCargo = "";
      if (p.cargoId) {
        const { data: jt } = await supabase.from("job_titles").select("title, grade, salary_range_id")
          .eq("id", p.cargoId).eq("root_company_id", activeCompanyId!).maybeSingle();
        if (jt) { grade = grade || jt.grade || ""; rangeId = jt.salary_range_id; baseCargo = jt.title; }
      }

      const { data: rows } = await supabase.from("survey_data")
        .select("job_title, job_code, grade, q1_value, q3_value, survey_tables!inner(root_company_id, is_active)")
        .or(`root_company_id.eq.${activeCompanyId},root_company_id.is.null`, { referencedTable: "survey_tables" })
        .eq("survey_tables.is_active", true)
        .limit(2000);
      const todas = (rows ?? []).filter((r) => r.q1_value > 0 && r.q3_value > 0);
      // Prioriza pesquisas da própria empresa.
      const daEmpresa = todas.filter((r) => (r.survey_tables as { root_company_id: string | null })?.root_company_id === activeCompanyId);
      for (const lista of [daEmpresa, todas]) {
        const porCbo = cbo ? lista.filter((r) => digits(r.job_code) === cbo) : [];
        const cand = porCbo.length ? porCbo : casarPorNome(lista, (r) => r.job_title, titulo);
        if (!cand.length) continue;
        const mesmaGrade = grade ? cand.filter((r) => norm(r.grade) === norm(grade)) : [];
        const r = (mesmaGrade.length ? mesmaGrade : cand)[0];
        return { min: round(r.q1_value), max: round(r.q3_value), fonte: "pesquisa", base: [r.job_title, r.grade].filter(Boolean).join(" ") };
      }

      if (!rangeId) {
        const { data: jts } = await supabase.from("job_titles").select("title, cbo_code, grade, salary_range_id")
          .eq("root_company_id", activeCompanyId!).not("salary_range_id", "is", null).limit(1000);
        const lista = jts ?? [];
        const porCbo = cbo ? lista.filter((j) => digits(j.cbo_code) === cbo) : [];
        const cand = porCbo.length ? porCbo : casarPorNome(lista, (j) => j.title, titulo);
        const mesmaGrade = grade ? cand.filter((j) => norm(j.grade) === norm(grade)) : [];
        const j = (mesmaGrade.length ? mesmaGrade : cand)[0];
        if (j) { rangeId = j.salary_range_id; baseCargo = j.title; }
      }
      if (rangeId) {
        const { data: sr } = await supabase.from("salary_ranges").select("min_value, max_value").eq("id", rangeId).maybeSingle();
        if (sr && sr.min_value > 0 && sr.max_value > 0) return { min: round(sr.min_value), max: round(sr.max_value), fonte: "tabela", base: baseCargo };
      }
      return null;
    },
  });
};
