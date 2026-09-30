// NR-1 utilities (multa estimada, hashing anônimo, labels)
import type { Database } from '@/integrations/supabase/types';

export type NivelRisco = 'baixo' | 'moderado' | 'alto' | 'critico';
export type Dimensao =
  | 'demandas_trabalho'
  | 'organizacao_conteudo'
  | 'relacoes_lideranca'
  | 'interface_trabalho_individuo'
  | 'valores_trabalho'
  | 'saude_bem_estar';

export const DIMENSAO_LABEL: Record<Dimensao, string> = {
  demandas_trabalho: 'Demandas no Trabalho',
  organizacao_conteudo: 'Organização e Conteúdo',
  relacoes_lideranca: 'Relações e Liderança',
  interface_trabalho_individuo: 'Interface Trabalho-Indivíduo',
  valores_trabalho: 'Valores no Trabalho',
  saude_bem_estar: 'Saúde e Bem-Estar',
};

export const RISCO_LABEL: Record<NivelRisco, string> = {
  baixo: 'Baixo',
  moderado: 'Moderado',
  alto: 'Alto',
  critico: 'Crítico',
};

export const RISCO_CLASS: Record<NivelRisco, string> = {
  baixo: 'nr1-risk-baixo',
  moderado: 'nr1-risk-moderado',
  alto: 'nr1-risk-alto',
  critico: 'nr1-risk-critico',
};

export function calcRisco(score: number | null | undefined): NivelRisco | null {
  if (score == null) return null;
  if (score <= 40) return 'baixo';
  if (score <= 60) return 'moderado';
  if (score <= 80) return 'alto';
  return 'critico';
}

/** Hash anônimo do respondente (LGPD) */
export async function respondentHash(userId: string, diagnosticoId: string): Promise<string> {
  const data = new TextEncoder().encode(`${diagnosticoId}::${userId}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const RESPOSTA_OPCOES = [
  { value: 0, label: 'Nunca / Discordo totalmente' },
  { value: 1, label: 'Raramente / Discordo' },
  { value: 2, label: 'Às vezes / Neutro' },
  { value: 3, label: 'Frequentemente / Concordo' },
  { value: 4, label: 'Sempre / Concordo totalmente' },
];

export type Questao = Database['public']['Tables']['nr1_questoes']['Row'];
export type Diagnostico = Database['public']['Tables']['nr1_diagnosticos']['Row'];

/**
 * Pontuação idêntica à da plataforma (nr1_recompute_scores):
 * média por dimensão (itens reversos = 4 - v) × 25, depois média das dimensões.
 */
export function calcScoreNr1(
  questoes: Pick<Questao, 'id' | 'dimensao' | 'reverso'>[],
  respostas: Record<string, number>,
): { geral: number; dimensoes: Record<string, number> } {
  const acc: Record<string, { soma: number; n: number }> = {};
  for (const q of questoes) {
    const v = respostas[q.id];
    if (v == null) continue;
    const d = String(q.dimensao);
    acc[d] ??= { soma: 0, n: 0 };
    acc[d].soma += q.reverso ? 4 - v : v;
    acc[d].n += 1;
  }
  const dimensoes: Record<string, number> = {};
  for (const [d, { soma, n }] of Object.entries(acc)) dimensoes[d] = Math.round((soma / n) * 25 * 100) / 100;
  const vals = Object.values(dimensoes);
  const geral = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : 0;
  return { geral, dimensoes };
}
