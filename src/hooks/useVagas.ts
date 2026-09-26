import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";

export type Senioridade = "junior" | "pleno" | "senior" | "especialista";
export type VagaStatus = "rascunho" | "publicada" | "pausada" | "fechada";

export interface Vaga {
  id: string;
  root_company_id: string;
  titulo: string;
  area: string | null;
  senioridade: Senioridade;
  cbo: string | null;
  descricao_cargo_id: string | null;
  responsabilidades: string | null;
  requisitos_obrigatorios: string | null;
  requisitos_desejaveis: string | null;
  competencias: string[];
  faixa_salarial_min: number | null;
  faixa_salarial_max: number | null;
  modelo_trabalho: "remoto" | "hibrido" | "presencial";
  localizacao: string | null;
  uf: string | null;
  cidade: string | null;
  tipo_contratacao: "clt" | "pj" | "estagio";
  qtd_vagas: number;
  status: VagaStatus;
  created_at: string;
  updated_at: string;
}

export type VagaInput = Omit<Vaga, "id" | "root_company_id" | "created_at" | "updated_at">;

export const SENIORIDADE_LABEL: Record<Senioridade, string> = {
  junior: "Júnior", pleno: "Pleno", senior: "Sênior", especialista: "Especialista",
};
export const STATUS_LABEL: Record<VagaStatus, string> = {
  rascunho: "Rascunho", publicada: "Publicada", pausada: "Pausada", fechada: "Fechada",
};
export const MODELO_LABEL = { remoto: "Remoto", hibrido: "Híbrido", presencial: "Presencial" } as const;
export const CONTRATACAO_LABEL = { clt: "CLT", pj: "PJ", estagio: "Estágio" } as const;

// A tabela é nova e ainda pode não estar nos tipos gerados.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const vagasTable = () => (supabase as any).from("vagas");

export const useVagas = () => {
  const { activeCompanyId } = useCompanyContext();
  return useQuery({
    queryKey: ["vagas", activeCompanyId],
    enabled: !!activeCompanyId,
    queryFn: async () => {
      const { data, error } = await vagasTable()
        .select("*")
        .eq("root_company_id", activeCompanyId)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Vaga[];
    },
  });
};

export const useSaveVaga = () => {
  const qc = useQueryClient();
  const { activeCompanyId } = useCompanyContext();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: VagaInput }) => {
      if (!activeCompanyId) throw new Error("Empresa não selecionada");
      const q = id
        ? vagasTable().update(input).eq("id", id).eq("root_company_id", activeCompanyId)
        : vagasTable().insert({ ...input, root_company_id: activeCompanyId });
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vagas"] }),
  });
};

export interface PerfilGerado {
  responsabilidades: string[];
  requisitos_obrigatorios: string[];
  requisitos_desejaveis: string[];
  competencias: string[];
}

export class TalentError extends Error {
  constructor(message: string, public status?: number) { super(message); }
}

export const gerarPerfilVaga = async (body: {
  titulo: string; area: string; senioridade: Senioridade; cbo: string; descricaoParcial: string;
}): Promise<PerfilGerado> => {
  const { data: s } = await supabase.auth.getSession();
  const res = await fetch(`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/agent-talent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${s.session?.access_token ?? ""}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new TalentError(data.error ?? "Não foi possível gerar o perfil.", res.status);
  return data as PerfilGerado;
};

export const salvarCargoNaBiblioteca = async (p: {
  title: string; cbo: string; jobFamily: string; grade: string;
  responsibilities: string; hardSkills: string; softSkills: string; experience: string;
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("talent_link_or_create_job_title", {
    _title: p.title, _cbo: p.cbo, _job_family: p.jobFamily, _grade: p.grade,
    _responsibilities: p.responsibilities, _hard_skills: p.hardSkills,
    _soft_skills: p.softSkills, _experience: p.experience,
  });
  if (error) throw error;
  return data as { id: string; existed: boolean };
};
