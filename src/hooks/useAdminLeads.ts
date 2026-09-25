import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const LEAD_STATUSES = ["novo", "em_contato", "convertido", "descartado"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  novo: "Novo",
  em_contato: "Em contato",
  convertido: "Convertido",
  descartado: "Descartado",
};

const ORIGEM_LABEL: Record<string, string> = {
  "materiais-ebook-remuneracao": "E-book Remuneração",
  "ebook:remuneracao": "E-book Remuneração",
  "ebook:nr1": "E-book NR-1",
  "ebook:clima-9box": "E-book Clima & 9-Box",
  demo: "Demonstração",
  diagnostico: "Diagnóstico",
  contato: "Contato",
  parceiro: "Parceiro",
  landing_nr1: "NR-1 Landing",
  landing_nr1_proposta: "NR-1 Proposta",
};

export const origemLabel = (o?: string | null) => {
  if (!o) return "—";
  if (ORIGEM_LABEL[o]) return ORIGEM_LABEL[o];
  return o.charAt(0).toUpperCase() + o.slice(1);
};

/** Status vazio ou desconhecido conta como "novo". */
export const normalizeStatus = (s?: string | null): LeadStatus =>
  (LEAD_STATUSES as readonly string[]).includes(s ?? "") ? (s as LeadStatus) : "novo";

export type AdminLead = {
  id: string;
  source: "leads" | "nr1";
  nome: string;
  email: string;
  empresa: string | null;
  cargo: string | null;
  porte: string | null;
  segmento: string | null;
  colaboradores: string | null;
  modulo_interesse: string | null;
  lead_magnet: string | null;
  parceria_tipo: string | null;
  especialidade: string | null;
  linkedin: string | null;
  telefone: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  score_free: number | null;
  nivel_risco_free: string | null;
  consentimento_lgpd: boolean | null;
  origem: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string;
};

type Row = Record<string, unknown>;
const s = (v: unknown) => (v == null || v === "" ? null : String(v));

export const useAdminLeads = () =>
  useQuery({
    queryKey: ["admin-leads"],
    queryFn: async (): Promise<AdminLead[]> => {
      const [a, b] = await Promise.all([
        supabase.from("leads").select("*").order("submitted_at", { ascending: false }).limit(1000),
        supabase.from("nr1_leads").select("*").order("created_at", { ascending: false }).limit(1000),
      ]);
      if (a.error) throw a.error;
      const main = ((a.data ?? []) as Row[]).map((l) => ({
        ...(l as unknown as AdminLead),
        source: "leads" as const,
        segmento: s(l.segmento),
        colaboradores: s(l.colaboradores),
        telefone: s(l.telefone),
        utm_source: s(l.utm_source),
        utm_medium: s(l.utm_medium),
        utm_campaign: s(l.utm_campaign),
        submitted_at: String(l.submitted_at ?? l.created_at),
      }));
      // Lista NR-1: somente leitura, sem status próprio.
      const nr1 = b.error ? [] : ((b.data ?? []) as Row[]).map((l): AdminLead => ({
        id: String(l.id),
        source: "nr1",
        nome: String(l.nome ?? ""),
        email: String(l.email ?? ""),
        empresa: s(l.empresa),
        cargo: s(l.cargo),
        porte: s(l.tamanho_empresa),
        segmento: null,
        colaboradores: null,
        modulo_interesse: null,
        lead_magnet: null,
        parceria_tipo: null,
        especialidade: null,
        linkedin: null,
        telefone: s(l.telefone),
        utm_source: s(l.utm_source),
        utm_medium: s(l.utm_medium),
        utm_campaign: s(l.utm_campaign),
        score_free: l.score_free == null ? null : Number(l.score_free),
        nivel_risco_free: s(l.nivel_risco_free),
        consentimento_lgpd: null,
        origem: s(l.origem),
        status: "novo",
        created_at: String(l.created_at),
        updated_at: String(l.created_at),
        submitted_at: String(l.created_at),
      }));
      return [...main, ...nr1].sort((x, y) => (y.submitted_at > x.submitted_at ? 1 : -1));
    },
  });

export const useUpdateLeadStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeadStatus }) => {
      const { error } = await supabase.from("leads").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-leads"] }),
  });
};
