export interface RegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  equation: string;
  predictedValues: { x: number; y: number }[];
}

export interface CurveComparison {
  slopeDifferencePercent: number;
  slopeDifferenceAbsolute: number;
  interpretation: string;
  intersectionPoint: number | null;
  fasterCurve: 'internal' | 'market' | 'equal';
}

export interface DataPoint {
  x: number;
  y: number;
}

/**
 * Calcula regressão linear usando o método dos mínimos quadrados
 * @param xValues - Valores do eixo X (grades convertidas para números)
 * @param yValues - Valores do eixo Y (medianas salariais)
 * @returns Resultado da regressão com slope, intercept, R², equação e valores previstos
 */
export function calculateLinearRegression(
  xValues: number[],
  yValues: number[]
): RegressionResult {
  const n = xValues.length;

  if (n === 0) {
    return {
      slope: 0,
      intercept: 0,
      rSquared: 0,
      equation: "y = 0",
      predictedValues: [],
    };
  }

  // Calcular médias
  const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
  const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;

  // Calcular soma dos produtos das diferenças e soma dos quadrados das diferenças de X
  let sumXYDiff = 0;
  let sumXDiffSquared = 0;

  for (let i = 0; i < n; i++) {
    const xDiff = xValues[i] - xMean;
    const yDiff = yValues[i] - yMean;
    sumXYDiff += xDiff * yDiff;
    sumXDiffSquared += xDiff * xDiff;
  }

  // Calcular slope (a) e intercept (b)
  const slope = sumXDiffSquared !== 0 ? sumXYDiff / sumXDiffSquared : 0;
  const intercept = yMean - slope * xMean;

  // Calcular valores previstos e R²
  const predictedValues: { x: number; y: number }[] = [];
  let ssRes = 0; // Soma dos quadrados dos resíduos
  let ssTot = 0; // Soma total dos quadrados

  for (let i = 0; i < n; i++) {
    const predicted = slope * xValues[i] + intercept;
    predictedValues.push({ x: xValues[i], y: predicted });

    const residual = yValues[i] - predicted;
    ssRes += residual * residual;

    const totalDiff = yValues[i] - yMean;
    ssTot += totalDiff * totalDiff;
  }

  // R² = 1 - (SSres / SStot)
  const rSquared = ssTot !== 0 ? 1 - ssRes / ssTot : 0;

  // Formatar equação
  const slopeFormatted = formatNumber(slope);
  const interceptFormatted = formatNumber(Math.abs(intercept));
  const interceptSign = intercept >= 0 ? "+" : "-";
  const equation = `y = ${slopeFormatted}x ${interceptSign} ${interceptFormatted}`;

  return {
    slope,
    intercept,
    rSquared: Math.max(0, Math.min(1, rSquared)), // Garantir que R² está entre 0 e 1
    equation,
    predictedValues: predictedValues.sort((a, b) => a.x - b.x),
  };
}

/**
 * Compara duas curvas de regressão e retorna análise comparativa
 */
export function compareCurves(
  internalRegression: RegressionResult,
  marketRegression: RegressionResult
): CurveComparison {
  const slopeDiff = internalRegression.slope - marketRegression.slope;
  const slopeDiffPercent =
    marketRegression.slope !== 0
      ? (Math.abs(slopeDiff) / Math.abs(marketRegression.slope)) * 100
      : 0;

  // Determinar qual curva cresce mais rápido
  let fasterCurve: 'internal' | 'market' | 'equal';
  if (Math.abs(slopeDiff) < 0.01) {
    fasterCurve = 'equal';
  } else if (internalRegression.slope > marketRegression.slope) {
    fasterCurve = 'internal';
  } else {
    fasterCurve = 'market';
  }

  // Calcular ponto de intersecção (se existir)
  let intersectionPoint: number | null = null;
  if (Math.abs(slopeDiff) > 0.01) {
    // x = (b2 - b1) / (a1 - a2)
    intersectionPoint =
      (marketRegression.intercept - internalRegression.intercept) / slopeDiff;
    
    // Só mostrar se a intersecção estiver em um range razoável (0-50)
    if (intersectionPoint < 0 || intersectionPoint > 50) {
      intersectionPoint = null;
    }
  }

  // Gerar interpretação textual
  let interpretation: string;
  const diffAbsFormatted = formatCurrency(Math.abs(slopeDiff));

  if (fasterCurve === 'equal') {
    interpretation = "As curvas têm inclinações praticamente idênticas, indicando progressões salariais similares entre grades.";
  } else if (fasterCurve === 'internal') {
    interpretation = `A curva interna cresce R$ ${diffAbsFormatted} mais por grade que o mercado. Isso indica que a empresa oferece progressões salariais mais agressivas.`;
  } else {
    interpretation = `A curva de mercado cresce R$ ${diffAbsFormatted} mais por grade que a tabela interna. Isso pode indicar necessidade de revisão da política de progressão salarial.`;
  }

  return {
    slopeDifferencePercent: slopeDiffPercent,
    slopeDifferenceAbsolute: Math.abs(slopeDiff),
    interpretation,
    intersectionPoint,
    fasterCurve,
  };
}

/**
 * Converte grade string para valor numérico para regressão
 */
export function gradeToNumeric(grade: string): number {
  const cleaned = grade.trim().toUpperCase();

  // Tenta extrair número puro
  const numericMatch = cleaned.match(/^0*(\d+)$/);
  if (numericMatch) {
    return parseInt(numericMatch[1], 10);
  }

  // Se tiver letras (A1, B02), extrai só o número
  const alphanumericMatch = cleaned.match(/(\d+)/);
  if (alphanumericMatch) {
    return parseInt(alphanumericMatch[1], 10);
  }

  // Fallback: usar posição alfabética
  const letterMatch = cleaned.match(/^([A-Z]+)$/);
  if (letterMatch) {
    let value = 0;
    for (let i = 0; i < letterMatch[1].length; i++) {
      value = value * 26 + (letterMatch[1].charCodeAt(i) - 64);
    }
    return value;
  }

  return 0;
}

/**
 * Formata número para exibição
 */
function formatNumber(value: number): string {
  if (Math.abs(value) >= 1000) {
    return value.toLocaleString("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formata valor como moeda
 */
function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Gera pontos para linha de regressão em um range específico
 */
export function generateRegressionLine(
  regression: RegressionResult,
  minX: number,
  maxX: number,
  steps: number = 10
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const stepSize = (maxX - minX) / (steps - 1);

  for (let i = 0; i < steps; i++) {
    const x = minX + i * stepSize;
    const y = regression.slope * x + regression.intercept;
    points.push({ x, y });
  }

  return points;
}
