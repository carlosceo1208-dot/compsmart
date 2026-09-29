/** Constantes do módulo Recrutamento & Seleção (Aquisição de Talentos). Ajuste aqui, não nas telas. */
export const CONSENTIMENTO_VERSAO = "2026-09-v1";
export const CURRICULO_MAX_MB = 5;
export const CURRICULO_MAX_BYTES = CURRICULO_MAX_MB * 1024 * 1024;
export const CURRICULO_TIPO = "application/pdf";
export const IMPORTACAO_MAX_LINHAS = 500;

export const CONSENTIMENTO_TEXTO =
  "Autorizo a empresa responsável por esta vaga a tratar meus dados pessoais (nome, e-mail, telefone e currículo) " +
  "exclusivamente para este e futuros processos seletivos, conforme a LGPD. Posso pedir a exclusão a qualquer momento.";

export type Etapa = "triagem" | "entrevista_rh" | "entrevista_gestor" | "proposta" | "contratado" | "arquivado";
export const ETAPA_LABEL: Record<Etapa, string> = {
  triagem: "Triagem", entrevista_rh: "Entrevista RH", entrevista_gestor: "Entrevista gestor",
  proposta: "Proposta", contratado: "Contratado", arquivado: "Arquivado",
};
export const ETAPAS: Etapa[] = ["triagem", "entrevista_rh", "entrevista_gestor", "proposta", "contratado", "arquivado"];
export const ETAPA_ENTREVISTA: Etapa[] = ["entrevista_rh", "entrevista_gestor"];
/** Próxima etapa do fluxo (Avançar). */
export const proximaEtapa = (e: Etapa): Etapa | null => {
  const i = ETAPAS.indexOf(e);
  return i < 0 || i >= 4 ? null : ETAPAS[i + 1];
};
/** Cor da coluna: tokens de status (azul → teal → verde; cinza para arquivado). */
export const ETAPA_COR: Record<Etapa, string> = {
  triagem: "border-t-primary", entrevista_rh: "border-t-teal-600", entrevista_gestor: "border-t-teal-600",
  proposta: "border-t-success", contratado: "border-t-success", arquivado: "border-t-muted-foreground",
};
export type Recomendacao = "avancar" | "agendar_entrevista" | "arquivar";
export const RECOMENDACAO_LABEL: Record<Recomendacao, string> = {
  avancar: "Avançar", agendar_entrevista: "Agendar entrevista", arquivar: "Arquivar",
};
export interface AnaliseTalent {
  match_score: number; pontos_fortes: string[]; gaps: string[]; recomendacao: Recomendacao; justificativa: string;
}
export const scoreClasse = (s: number) =>
  s >= 80 ? "bg-success text-success-foreground" : s >= 60 ? "bg-primary text-primary-foreground" : "bg-warning text-warning-foreground";
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
