// Vitalidade (NR-1): escala própria (base UWES-vigor e WHO-5 + complementos),
// 4 dimensões próprias. Maior = mais vitalidade. Não usa as 6 dimensões do COPSOQ.
export type VitDimensao = 'energia' | 'recuperacao' | 'equilibrio' | 'satisfacao';
export const VIT_DIMENSOES: VitDimensao[] = ['energia', 'recuperacao', 'equilibrio', 'satisfacao'];
export const VIT_DIM_LABEL: Record<VitDimensao, string> = {
  energia: 'Energia',
  recuperacao: 'Recuperação',
  equilibrio: 'Equilíbrio',
  satisfacao: 'Satisfação',
};
export const VIT_K_MINIMO = 5;

export type VitQuestao = {
  id: string; codigo: string; dimensao: VitDimensao; origem: 'propria' | 'copsoq';
  copsoq_questao_id: string | null; enunciado: string | null; ordem: number; reverso: boolean;
};

/** Mesma regra do servidor (_nr1_vitalidade_agregar). Itens 'copsoq' usam a resposta já dada no bloco do diagnóstico. */
export function calcScoreVitalidade(questoes: VitQuestao[], proprias: Record<string, number>, copsoq: Record<string, number>) {
  const acc: Record<string, { soma: number; n: number }> = {};
  for (const q of questoes) {
    const v = q.origem === 'copsoq' ? (q.copsoq_questao_id ? copsoq[q.copsoq_questao_id] : undefined) : proprias[q.id];
    if (v == null) continue;
    acc[q.dimensao] ??= { soma: 0, n: 0 };
    acc[q.dimensao].soma += q.reverso ? 4 - v : v;
    acc[q.dimensao].n += 1;
  }
  const dimensoes: Record<string, number> = {};
  for (const [d, { soma, n }] of Object.entries(acc)) dimensoes[d] = Math.round((soma / n) * 25 * 100) / 100;
  const vals = Object.values(dimensoes);
  const geral = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : 0;
  return { geral, dimensoes };
}

export const vitDimLabel = (d: string) => VIT_DIM_LABEL[d as VitDimensao] ?? d;
