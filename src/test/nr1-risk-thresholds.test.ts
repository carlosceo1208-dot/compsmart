import { describe, expect, it } from 'vitest';
import { calcRisco } from '@/lib/nr1';

describe('NR-1 · faixas de risco 40/60/80', () => {
  it.each([
    [0, 'baixo'], [40, 'baixo'], [40.01, 'moderado'], [60, 'moderado'],
    [60.01, 'alto'], [80, 'alto'], [80.01, 'critico'], [100, 'critico'],
  ] as const)('classifica %s como %s', (score, esperado) => {
    expect(calcRisco(score)).toBe(esperado);
  });
});