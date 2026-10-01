// Segurança Psicológica (NR-1): escala própria (Edmondson + complementos),
// mapeada para as 6 dimensões da casa. Maior = mais segurança.
import { DIMENSAO_LABEL, type Dimensao } from '@/lib/nr1';

export type SegPsiQuestao = { id: string; codigo: string; dimensao: Dimensao; enunciado: string; ordem: number; reverso: boolean };

export const SEGPSI_K_MINIMO = 5;

/** Mesma regra do servidor (_nr1_segpsi_agregar): média por dimensão (reverso = 4 - v) × 25; geral = média das dimensões. */
export function calcScoreSegPsi(questoes: SegPsiQuestao[], respostas: Record<string, number>) {
  const acc: Record<string, { soma: number; n: number }> = {};
  for (const q of questoes) {
    const v = respostas[q.id];
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

export type SegPsiStatus = 'saudavel' | 'atencao' | 'critico';
export function statusSegPsi(score: number): { key: SegPsiStatus; label: string; variant: 'default' | 'secondary' | 'destructive' } {
  if (score >= 70) return { key: 'saudavel', label: 'Saudável', variant: 'default' };
  if (score >= 55) return { key: 'atencao', label: 'Atenção', variant: 'secondary' };
  return { key: 'critico', label: 'Crítico', variant: 'destructive' };
}

export const dimensaoLabel = (d: string) => DIMENSAO_LABEL[d as Dimensao] ?? d;
