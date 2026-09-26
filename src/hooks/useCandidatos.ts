import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";
import type { Etapa } from "@/config/recrutamento";
import type { Senioridade } from "@/hooks/useVagas";

export interface Candidatura { id: string; vaga_id: string; etapa: Etapa; status: string; created_at: string; vagas?: { titulo: string } | null }
export interface Candidato {
  id: string; nome: string; email: string; telefone: string | null; cargo_pretendido: string | null;
  senioridade: Senioridade | null; observacoes: string | null; curriculo_url: string | null;
  fonte: "rh" | "portal"; consentimento_lgpd: boolean; consentimento_data: string | null;
  consentimento_versao: string | null; created_at: string; candidaturas: Candidatura[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const useCandidatos = () => {
  const { activeCompanyId } = useCompanyContext();
  return useQuery({
    queryKey: ["candidatos", activeCompanyId],
    enabled: !!activeCompanyId,
    queryFn: async () => {
      const { data, error } = await db.from("candidatos")
        .select("*, candidaturas(id, vaga_id, etapa, status, created_at, vagas(titulo))")
        .eq("root_company_id", activeCompanyId).order("created_at", { ascending: false }).limit(1000);
      if (error) throw error;
      return (data ?? []) as Candidato[];
    },
  });
};

export interface CandidatoInput {
  nome: string; email: string; telefone: string; cargo: string; senioridade: string; observacoes: string; vagaIds: string[];
}

export const upsertCandidato = async (i: CandidatoInput) => {
  const { data, error } = await db.rpc("talent_upsert_candidato", {
    _nome: i.nome, _email: i.email, _telefone: i.telefone, _cargo: i.cargo,
    _senioridade: i.senioridade, _observacoes: i.observacoes, _vaga_ids: i.vagaIds,
  });
  if (error) throw error;
  return data as { id: string; existed: boolean; candidaturas: number };
};

export const useSalvarCandidato = () => {
  const qc = useQueryClient();
  const { activeCompanyId } = useCompanyContext();
  return useMutation({
    mutationFn: async ({ input, curriculo }: { input: CandidatoInput; curriculo?: File | null }) => {
      const r = await upsertCandidato(input);
      if (curriculo && activeCompanyId) {
        const path = `${activeCompanyId}/${r.id}.pdf`; // caminho fixo: novo PDF sobrescreve o anterior
        const { error } = await supabase.storage.from("curriculos").upload(path, curriculo, { upsert: true, contentType: "application/pdf" });
        if (error) throw error;
        const { error: e2 } = await db.from("candidatos").update({ curriculo_url: path }).eq("id", r.id);
        if (e2) throw e2;
      }
      return r;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["candidatos"] }); qc.invalidateQueries({ queryKey: ["candidaturas-contagem"] }); },
  });
};

export const abrirCurriculo = async (path: string) => {
  const { data, error } = await supabase.storage.from("curriculos").createSignedUrl(path, 300);
  if (error || !data) throw error ?? new Error("Não foi possível abrir o currículo.");
  window.open(data.signedUrl, "_blank", "noopener");
};
