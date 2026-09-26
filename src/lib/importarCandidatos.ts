import { EMAIL_RE, IMPORTACAO_MAX_LINHAS, telefoneValido } from "@/config/recrutamento";

export interface LinhaImportada { linha: number; nome: string; email: string; telefone: string; erro?: string }

/** Valida "nome;email;telefone" linha a linha. Nunca corrige: só sinaliza. */
export const validarColagem = (texto: string): LinhaImportada[] => {
  const vistos = new Map<string, number>();
  return texto.split(/\r?\n/).map((raw, idx) => ({ raw, n: idx + 1 }))
    .filter(({ raw }) => raw.trim() !== "")
    .slice(0, IMPORTACAO_MAX_LINHAS)
    .map(({ raw, n }) => {
      const partes = raw.split(";").map((s) => s.trim());
      const [nome = "", emailRaw = "", telefone = ""] = partes;
      const email = emailRaw.toLowerCase();
      const base = { linha: n, nome, email, telefone };
      if (partes.length !== 3) return { ...base, erro: "Formato esperado: nome;email;telefone" };
      if (nome.length < 2) return { ...base, erro: "Nome ausente ou curto" };
      if (!EMAIL_RE.test(email)) return { ...base, erro: "E-mail inválido" };
      if (telefone && !telefoneValido(telefone)) return { ...base, erro: "Telefone inválido (use DDD + número)" };
      const prev = vistos.get(email);
      if (prev) return { ...base, erro: `Duplicado na planilha (linha ${prev})` };
      vistos.set(email, n);
      return base;
    });
};
