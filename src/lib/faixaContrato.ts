export type FonteFaixa = "pesquisa de mercado" | "tabela salarial" | "dados da empresa";
export const FONTES_FAIXA: readonly FonteFaixa[] = ["pesquisa de mercado", "tabela salarial", "dados da empresa"];
export interface SugestaoFaixa { min: number; max: number; fonte: FonteFaixa }

/** Contrato: exatamente {min,max,fonte}. Nulos = sem posição similar. Qualquer outro formato é rejeitado. */
export function lerSugestaoFaixa(r: unknown): SugestaoFaixa | null {
  if (!r || typeof r !== "object") throw new Error("Resposta inválida");
  const o = r as Record<string, unknown>;
  const keys = Object.keys(o).sort();
  if (keys.length !== 3 || keys.join(",") !== "fonte,max,min") throw new Error("Contrato violado");
  if (o.fonte === null) return null;
  if (!FONTES_FAIXA.includes(o.fonte as FonteFaixa) || typeof o.min !== "number" || typeof o.max !== "number") throw new Error("Contrato violado");
  return { min: o.min, max: o.max, fonte: o.fonte as FonteFaixa };
}
