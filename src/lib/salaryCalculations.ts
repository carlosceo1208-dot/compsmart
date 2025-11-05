interface SalaryRange {
  min_value: number;
  median_value: number;
  max_value: number;
}

/**
 * Calcula o percentual de posição salarial usando a fórmula de 3 casos:
 * - Abaixo do mínimo: ((salary - min) / min) * 100 (negativo)
 * - Dentro da faixa: (salary / median) * 100 (0-100%, comparado ao mercado)
 * - Acima do máximo: (salary / max) * 100 (>100%)
 */
export const calculateSalaryRangePercentage = (
  salary: number,
  range: SalaryRange
): number => {
  const { min_value, median_value, max_value } = range;

  // CASO 1: Abaixo do mínimo (negativo)
  if (salary < min_value) {
    return ((salary - min_value) / min_value) * 100;
  }
  
  // CASO 2: Dentro da faixa (0-100%, comparado ao ponto médio = mercado)
  else if (salary >= min_value && salary <= max_value) {
    return (salary / median_value) * 100;
  }
  
  // CASO 3: Acima do máximo (>100%)
  else {
    return (salary / max_value) * 100;
  }
};

/**
 * Formata o percentual com 2 casas decimais
 */
export const formatSalaryPercentage = (percentage: number): string => {
  return percentage.toFixed(2);
};

/**
 * Retorna badge colorido baseado no percentual
 */
export const getSalaryStatusBadge = (percentage: number) => {
  if (percentage < 0) {
    return { 
      color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300', 
      label: '⚠️ Abaixo do Mínimo' 
    };
  } else if (percentage < 80) {
    return { 
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300', 
      label: '📊 Início da Faixa' 
    };
  } else if (percentage < 100) {
    return { 
      color: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300', 
      label: '✅ Próximo ao Mercado' 
    };
  } else if (percentage <= 110) {
    return { 
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300', 
      label: '🔸 Acima da Faixa' 
    };
  } else {
    return { 
      color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300', 
      label: '🔴 Muito Acima do Teto' 
    };
  }
};
