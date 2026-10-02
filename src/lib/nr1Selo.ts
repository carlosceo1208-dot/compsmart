// Selo único do NR-1 (Inteligência): nota de saúde = 100 − risco psicossocial (COPSOQ).
// Limites iguais aos de statusSegPsi: ≥70 Saudável, 55–69 Atenção, <55 Crítico.
import { statusSegPsi, type SegPsiStatus } from '@/lib/nr1SegPsi';

export const FATOR_REPOSICAO = 0.5;
export const MESES_ANO = 13.33;

export function notaSaude(risco: number | null | undefined): number | null {
  if (risco == null || Number.isNaN(Number(risco))) return null;
  return Math.round((100 - Number(risco)) * 10) / 10;
}

export function seloSaude(saude: number | null | undefined): { key: SegPsiStatus; label: string; variant: 'default' | 'secondary' | 'destructive' } | null {
  if (saude == null) return null;
  return statusSegPsi(saude);
}

/** Custo de turnover (A2): estrelas em risco × salário médio anual das estrelas × 0,5. Só conta se o selo não for Saudável. */
export function custoTurnover(estrelas: number | null, salarioMensalEstrelas: number | null, saude: number | null): number {
  const selo = seloSaude(saude);
  if (!selo || selo.key === 'saudavel' || !estrelas || !salarioMensalEstrelas) return 0;
  return estrelas * salarioMensalEstrelas * MESES_ANO * FATOR_REPOSICAO;
}

export const NOTA_METODO =
  'Nota de saúde = 100 − risco psicossocial (COPSOQ-III). Selo: ≥70 Saudável, 55–69 Atenção, <55 Crítico. ' +
  'Recortes com menos de 5 pessoas ficam ocultos (k=5). Custo de turnover estimado = nº de estrelas 9Box (quadrantes 7–9) ' +
  'em unidade Atenção/Crítico × salário médio anual dessas estrelas (mensal × 13,33) × fator de reposição 0,5. ' +
  'O risco de cada unidade é o do último diagnóstico concluído da empresa no período (o diagnóstico é anônimo e não é separado por unidade).';

export const K_MINIMO = 5;
export const LIMIAR_TENDENCIA = 0.5;

export type Tendencia = 'evolucao' | 'piora' | 'estavel' | 'nao_comparavel';

/** Compara dois ciclos na escala de nota de saúde. A = base, B = comparado. */
export function compararCiclos(
  a: { score_geral: number | null | undefined; total_respondentes: number | null | undefined },
  b: { score_geral: number | null | undefined; total_respondentes: number | null | undefined },
): { tendencia: Tendencia; saudeA: number | null; saudeB: number | null; delta: number | null } {
  const ok = (c: typeof a) => (c.total_respondentes ?? 0) >= K_MINIMO && c.score_geral != null;
  if (!ok(a) || !ok(b)) return { tendencia: 'nao_comparavel', saudeA: null, saudeB: null, delta: null };
  const saudeA = notaSaude(a.score_geral)!;
  const saudeB = notaSaude(b.score_geral)!;
  // delta sobre os valores sem arredondar (saúde B − saúde A = risco A − risco B)
  const delta = Math.round((Number(a.score_geral) - Number(b.score_geral)) * 100) / 100;
  const tendencia: Tendencia = delta >= LIMIAR_TENDENCIA ? 'evolucao' : delta <= -LIMIAR_TENDENCIA ? 'piora' : 'estavel';
  return { tendencia, saudeA, saudeB, delta };
}
