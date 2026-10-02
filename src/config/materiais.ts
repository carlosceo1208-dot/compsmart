import type { LeadOrigem } from "@/hooks/usePublicLead";

/**
 * Fonte única dos materiais públicos (Home e /materiais).
 * "disponivel" entrega o e-book pelo EbookDownloadDialog (origem fixa no banco:
 * materiais-ebook-remuneracao); "em_breve" só capta interesse via usePublicLead.
 */
export interface MaterialPublico {
  slug: "remuneracao" | "nr1" | "clima-9box";
  titulo: string;
  beneficio: string;
  status: "disponivel" | "em_breve";
  /** Origem gravada no lead quando o material ainda não existe. */
  origem: LeadOrigem;
  leadMagnet: string;
  ctaId: string;
}

export const MATERIAIS: MaterialPublico[] = [
  {
    slug: "remuneracao",
    titulo:
      "Remuneração Estratégica — Como atrair e reter talentos com um pacote de remuneração total competitivo",
    beneficio:
      "O caminho prático para estruturar cargos, faixas, benefícios e incentivos que sustentam a retenção.",
    status: "disponivel",
    origem: "ebook:remuneracao",
    leadMagnet: "remuneracao",
    ctaId: "cta-ebook-remuneracao",
  },
  {
    slug: "nr1",
    titulo: "NR-1 e Riscos Psicossociais",
    beneficio:
      "O que a norma exige, como fazer o diagnóstico anônimo e como documentar o plano de ação.",
    status: "em_breve",
    origem: "ebook:nr1",
    leadMagnet: "nr1",
    ctaId: "cta-ebook-nr1",
  },
  {
    slug: "clima-9box",
    titulo: "Clima e 9-Box",
    beneficio:
      "Como ligar percepção de clima, desempenho e potencial às decisões de retenção e sucessão.",
    status: "em_breve",
    origem: "ebook:clima-9box",
    leadMagnet: "clima-9box",
    ctaId: "cta-ebook-clima-9box",
  },
];
