import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";

export type Senioridade = "junior" | "pleno" | "senior" | "especialista" | "profissional" | "consultor";
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
  observacao: string | null;
  status: VagaStatus;
  visibilidade: Visibilidade;
  exibir_nome_empresa: boolean;
  exibir_faixa: boolean;
  descricao_publica_cliente: string | null;
  logo_path: string | null;
  sobre_empresa: string | null;
  slug: string;
  created_at: string;
  updated_at: string;
}

export type Visibilidade = "publica" | "confidencial";
export const VISIBILIDADE_LABEL: Record<Visibilidade, string> = { publica: "Pública", confidencial: "Confidencial" };

export type VagaInput = Omit<Vaga, "id" | "root_company_id" | "created_at" | "updated_at" | "slug" | "logo_path">;

/** Nº de candidaturas por vaga da empresa ativa. */
export const useContagemCandidaturas = () => {
  const { activeCompanyId } = useCompanyContext();
  return useQuery({
    queryKey: ["candidaturas-contagem", activeCompanyId],
    enabled: !!activeCompanyId,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).from("candidaturas").select("vaga_id").eq("root_company_id", activeCompanyId);
      if (error) throw error;
      const m: Record<string, number> = {};
      for (const r of (data ?? []) as { vaga_id: string }[]) m[r.vaga_id] = (m[r.vaga_id] ?? 0) + 1;
      return m;
    },
  });
};

export const SENIORIDADE_LABEL: Record<Senioridade, string> = {
  junior: "Júnior", pleno: "Pleno", senior: "Sênior", especialista: "Especialista",
  profissional: "Profissional", consultor: "Consultor",
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
      const dados = typeof input.titulo === "string" ? { ...input, titulo: input.titulo.trim() } : input;
      const q = id
        ? vagasTable().update(dados).eq("id", id).eq("root_company_id", activeCompanyId)
        : vagasTable().insert({ ...dados, root_company_id: activeCompanyId });
      const { data, error } = await q.select("id").single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vagas"] }),
  });
};

export const useDeleteVaga = () => {
  const qc = useQueryClient();
  const { activeCompanyId } = useCompanyContext();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!activeCompanyId) throw new Error("Empresa não selecionada");
      const { data: atual } = await vagasTable().select("logo_path").eq("id", id).eq("root_company_id", activeCompanyId).maybeSingle();
      const { data, error } = await vagasTable().delete()
        .eq("id", id).eq("root_company_id", activeCompanyId).eq("status", "rascunho").select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("Somente vagas em rascunho podem ser excluídas.");
      if (atual?.logo_path) await supabase.storage.from(LOGO_BUCKET).remove([atual.logo_path]);
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

export const LOGO_BUCKET = "logos-vagas";
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const LOGO_TIPOS: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
export const SOBRE_EMPRESA_MAX = 600;

/** Valida o arquivo de logo; retorna mensagem de erro ou null. */
export const validarLogo = (f: File) =>
  !LOGO_TIPOS[f.type] ? "Envie um logo em PNG, JPG ou WebP." : f.size > LOGO_MAX_BYTES ? "O logo deve ter até 2 MB." : null;

/** Envia o novo logo, grava na vaga e apaga o arquivo anterior (sem órfãos). */
export const salvarLogoVaga = async (p: { companyId: string; vagaId: string; file: File | null; anterior: string | null }) => {
  let novo: string | null = null;
  if (p.file) {
    const erro = validarLogo(p.file);
    if (erro) throw new Error(erro);
    novo = `${p.companyId}/${p.vagaId}-${Date.now()}.${LOGO_TIPOS[p.file.type]}`;
    const { error } = await supabase.storage.from(LOGO_BUCKET).upload(novo, p.file, { contentType: p.file.type });
    if (error) throw error;
  }
  const { error } = await vagasTable().update({ logo_path: novo }).eq("id", p.vagaId).eq("root_company_id", p.companyId);
  if (error) {
    if (novo) await supabase.storage.from(LOGO_BUCKET).remove([novo]);
    throw error;
  }
  if (p.anterior && p.anterior !== novo) await supabase.storage.from(LOGO_BUCKET).remove([p.anterior]);
};

/** URL temporária do logo (espaço privado; o servidor só libera logos exibíveis). */
export const useLogoUrl = (path: string | null | undefined) =>
  useQuery({
    queryKey: ["logo-vaga", path],
    enabled: !!path,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(LOGO_BUCKET).createSignedUrl(path!, 3600);
      if (error) return null;
      return data.signedUrl;
    },
  });
