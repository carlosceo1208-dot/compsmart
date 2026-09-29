import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";
import type { AnaliseTalent, Etapa } from "@/config/recrutamento";

export interface CandidaturaTriagem {
  id: string; vaga_id: string; candidato_id: string; etapa: Etapa; created_at: string;
  etapa_desde: string | null; entrevista_em: string | null; motivo_arquivamento: string | null;
  analise_talent: AnaliseTalent | null; analise_em: string | null;
  candidatos: { nome: string; email: string; fonte: "rh" | "portal"; curriculo_url: string | null } | null;
}
export interface HistoricoItem {
  id: string; etapa_anterior: string | null; etapa_nova: string; motivo: string | null;
  origem: "agente" | "manual"; criado_por: string | null; criado_em: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
const chave = (vagaId: string | null) => ["triagem", vagaId];

export const useTriagem = (vagaId: string | null) => {
  const { activeCompanyId } = useCompanyContext();
  return useQuery({
    queryKey: chave(vagaId),
    enabled: !!activeCompanyId && !!vagaId,
    queryFn: async () => {
      const { data, error } = await db.from("candidaturas")
        .select("id, vaga_id, candidato_id, etapa, created_at, etapa_desde, entrevista_em, motivo_arquivamento, analise_talent, analise_em, candidatos(nome, email, fonte, curriculo_url)")
        .eq("root_company_id", activeCompanyId).eq("vaga_id", vagaId).order("created_at");
      if (error) throw error;
      return (data ?? []) as CandidaturaTriagem[];
    },
  });
};

export const useHistorico = (candidaturaId: string | null) =>
  useQuery({
    queryKey: ["candidato-historico", candidaturaId],
    enabled: !!candidaturaId,
    queryFn: async () => {
      const { data, error } = await db.from("candidato_historico").select("*")
        .eq("candidatura_id", candidaturaId).order("criado_em", { ascending: false });
      if (error) throw error;
      const itens = (data ?? []) as HistoricoItem[];
      const ids = [...new Set(itens.map((i) => i.criado_por).filter(Boolean))];
      const nomes: Record<string, string> = {};
      if (ids.length) {
        const { data: p } = await db.from("profiles_directory").select("id, full_name").in("id", ids);
        (p ?? []).forEach((x: { id: string; full_name: string | null }) => { nomes[x.id] = x.full_name ?? ""; });
      }
      return itens.map((i) => ({ ...i, responsavel: i.criado_por ? nomes[i.criado_por] || "Usuário do RH" : "—" }));
    },
  });

export interface Movimento { id: string; etapa: Etapa; motivo?: string; origem?: "agente" | "manual"; entrevistaEm?: string | null }

/** Move a candidatura na hora (otimista) e desfaz se o servidor recusar. */
export const useMoverCandidatura = (vagaId: string | null) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: Movimento) => {
      const { error } = await db.rpc("talent_mover_candidatura", {
        _id: m.id, _etapa: m.etapa, _motivo: m.motivo ?? null, _origem: m.origem ?? "manual", _entrevista_em: m.entrevistaEm ?? null,
      });
      if (error) throw new Error(error.message);
    },
    onMutate: async (m) => {
      await qc.cancelQueries({ queryKey: chave(vagaId) });
      const antes = qc.getQueryData<CandidaturaTriagem[]>(chave(vagaId));
      qc.setQueryData<CandidaturaTriagem[]>(chave(vagaId), (l) =>
        l?.map((c) => (c.id === m.id ? { ...c, etapa: m.etapa, etapa_desde: new Date().toISOString(), entrevista_em: m.entrevistaEm ?? c.entrevista_em } : c)));
      return { antes };
    },
    onError: (_e, _m, ctx) => { if (ctx?.antes) qc.setQueryData(chave(vagaId), ctx.antes); },
    onSettled: (_d, _e, m) => {
      qc.invalidateQueries({ queryKey: chave(vagaId) });
      qc.invalidateQueries({ queryKey: ["candidato-historico", m.id] });
      qc.invalidateQueries({ queryKey: ["candidatos"] });
    },
  });
};

export class AnaliseErro extends Error { constructor(msg: string, public code?: string | number) { super(msg); } }

export const useAnalisarCurriculo = (vagaId: string | null) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (candidaturaId: string) => {
      const { data: s } = await supabase.auth.getSession();
      let res: Response;
      try {
        res = await fetch(`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/agent-talent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${s.session?.access_token ?? ""}`,
          },
          body: JSON.stringify({ acao: "analisar", candidaturaId }),
        });
      } catch {
        throw new AnaliseErro("Sem conexão com o agente Talent. Tente novamente.");
      }
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new AnaliseErro(body?.error ?? "O agente Talent não conseguiu analisar agora.", body?.code);
      return body.analise as AnaliseTalent;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: chave(vagaId) }),
  });
};
