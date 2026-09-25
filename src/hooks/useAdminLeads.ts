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
};

export const origemLabel = (o?: string | null) => {
  if (!o) return "—";
  if (ORIGEM_LABEL[o]) return ORIGEM_LABEL[o];
  return o.charAt(0).toUpperCase() + o.slice(1);
};

/** Status vazio ou desconhecido conta como "novo". */
export const normalizeStatus = (s?: string | null): LeadStatus =>
  (LEAD_STATUSES as readonly string[]).includes(s ?? "") ? (s as LeadStatus) : "novo";

export const useAdminLeads = () =>
  useQuery({
    queryKey: ["admin-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data ?? [];
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
