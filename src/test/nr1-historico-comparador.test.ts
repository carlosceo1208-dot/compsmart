import { describe, expect, it } from 'vitest';
import { compararCiclos } from '@/lib/nr1Selo';

const c = (score_geral: number | null, total_respondentes = 10) => ({ score_geral, total_respondentes });

describe('compararCiclos (A = base, B = comparado, escala de nota de saúde)', () => {
  it('risco cai → nota de saúde sobe → evolução', () => {
    const r = compararCiclos(c(60), c(50));
    expect(r.tendencia).toBe('evolucao');
    expect(r.delta).toBe(10);
    expect(r.saudeA).toBe(40);
    expect(r.saudeB).toBe(50);
  });
  it('risco sobe → nota de saúde cai → piora', () => {
    const r = compararCiclos(c(49.93), c(55));
    expect(r.tendencia).toBe('piora');
    expect(r.delta).toBeCloseTo(-5.07);
  });
  it('delta exatamente 0,5 → evolução (limiar inclusivo)', () => {
    expect(compararCiclos(c(50.5), c(50)).tendencia).toBe('evolucao');
    expect(compararCiclos(c(50), c(50.5)).tendencia).toBe('piora');
  });
  it('delta 0,49 → estável', () => {
    expect(compararCiclos(c(50.49), c(50)).tendencia).toBe('estavel');
  });
  it('ciclo com menos de 5 respondentes → não comparável, sem nota', () => {
    const r = compararCiclos(c(40, 4), c(50, 5));
    expect(r).toEqual({ tendencia: 'nao_comparavel', saudeA: null, saudeB: null, delta: null });
    expect(compararCiclos(c(40, 5), c(50, 4)).tendencia).toBe('nao_comparavel');
  });
});
