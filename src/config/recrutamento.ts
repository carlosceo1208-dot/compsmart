/** Constantes do módulo Recrutamento & Seleção (Aquisição de Talentos). Ajuste aqui, não nas telas. */
export const CONSENTIMENTO_VERSAO = "2026-09-v1";
export const CURRICULO_MAX_MB = 5;
export const CURRICULO_MAX_BYTES = CURRICULO_MAX_MB * 1024 * 1024;
export const CURRICULO_TIPO = "application/pdf";
export const IMPORTACAO_MAX_LINHAS = 500;

export const CONSENTIMENTO_TEXTO =
  "Autorizo a empresa responsável por esta vaga a tratar meus dados pessoais (nome, e-mail, telefone e currículo) " +
  "exclusivamente para este e futuros processos seletivos, conforme a LGPD. Posso pedir a exclusão a qualquer momento.";

export type Etapa = "triagem" | "entrevista_rh" | "entrevista_gestor" | "proposta" | "contratado";
export const ETAPA_LABEL: Record<Etapa, string> = {
  triagem: "Triagem", entrevista_rh: "Entrevista RH", entrevista_gestor: "Entrevista gestor",
  proposta: "Proposta", contratado: "Contratado",
};
export const FONTE_LABEL = { rh: "RH", portal: "Portal" } as const;

export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Máscara (00) 00000-0000 / (00) 0000-0000. */
export const mascaraTelefone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};
export const telefoneValido = (v: string) => { const n = v.replace(/\D/g, "").length; return n === 10 || n === 11; };

export const linkPublicoVaga = (slug: string) => `${window.location.origin}/vagas/${slug}`;
