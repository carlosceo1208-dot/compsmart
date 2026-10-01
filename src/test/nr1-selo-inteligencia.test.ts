import { describe, expect, it } from 'vitest';
import { notaSaude, seloSaude, custoTurnover } from '@/lib/nr1Selo';
import { ordenarPrioridades, type UnitCrossInsight } from '@/hooks/useNr1Intelligence';

describe('NR-1 · selo único 70/55 sobre nota de saúde', () => {
  it('risco 49,93 vira saúde 50,1 e Crítico', () => {
    expect(notaSaude(49.93)).toBe(50.1);
    expect(seloSaude(50.1)?.label).toBe('Crítico');
  });
  it.each([[70, 'Saudável'], [69.9, 'Atenção'], [55, 'Atenção'], [54.9, 'Crítico']] as const)('%s → %s', (s, l) => {
    expect(seloSaude(s)?.label).toBe(l);
  });
});

describe('A2 · custo de turnover', () => {
  it('estrelas × salário anual × 0,5 só fora do Saudável', () => {
    expect(custoTurnover(2, 10000, 50)).toBeCloseTo(2 * 10000 * 13.33 * 0.5);
    expect(custoTurnover(2, 10000, 80)).toBe(0);
  });
});

describe('A7 · ordem fixa', () => {
  const u = (p: Partial<UnitCrossInsight>): UnitCrossInsight => ({
    unitId: p.unitName ?? null, unitName: '', totalColab: 5, criticos9Box: 0, estrelas9Box: 0, avgPerformance: null,
    avgSalary: null, salarioMedioEstrelas: null, saude: 80, custoTurnover: 0, causaRaiz: false, alertas: [], ...p,
  });
  it('causa raiz → crítico com estrelas → custo → colaboradores', () => {
    const r = ordenarPrioridades([
      u({ unitName: 'D', totalColab: 9 }),
      u({ unitName: 'C', custoTurnover: 500 }),
      u({ unitName: 'B', saude: 40, estrelas9Box: 1 }),
      u({ unitName: 'A', causaRaiz: true }),
      u({ unitName: 'E', totalColab: 6 }),
    ]);
    expect(r.map((x) => x.unitName)).toEqual(['A', 'B', 'C', 'D', 'E']);
  });
});
