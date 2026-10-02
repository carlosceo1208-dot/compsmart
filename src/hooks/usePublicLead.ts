import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Nomenclatura fixa de origem dos leads públicos (segmentação e follow-up). */
export type LeadOrigem =
  | "demo"
  | "diagnostico-home"
  | "contato"
  | "parceiro"
  | "ebook:remuneracao"
  | "ebook:nr1"
  | "ebook:clima-9box";

export interface PublicLeadInput {
  nome: string;
  email: string;
  empresa?: string | null;
  cargo?: string | null;
  porte?: string | null;
  modulo_interesse?: string | null;
  lead_magnet?: string | null;
  origem: LeadOrigem;
  linkedin?: string | null;
  parceria_tipo?: "indicacao" | "consultor" | "ambos" | null;
  especialidade?: string | null;
}

export const PORTE_OPTIONS = [
  "Até 50 colaboradores",
  "51 a 250 colaboradores",
  "251 a 1.000 colaboradores",
  "Mais de 1.000 colaboradores",
];

export const usePublicLead = () =>
  useMutation({
    mutationFn: async (input: PublicLeadInput) => {
      const { error } = await supabase.from("leads").insert({
        nome: input.nome.trim(),
        email: input.email.trim().toLowerCase(),
        empresa: input.empresa?.trim() || null,
        cargo: input.cargo?.trim() || null,
        porte: input.porte || null,
        modulo_interesse: input.modulo_interesse || null,
        lead_magnet: input.lead_magnet || null,
        origem: input.origem,
        linkedin: input.linkedin?.trim() || null,
        parceria_tipo: input.parceria_tipo || null,
        especialidade: input.especialidade?.trim() || null,
        consentimento_lgpd: true,
      });
      if (error) throw error;
    },
  });
