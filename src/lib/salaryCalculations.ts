interface SalaryRange {
  min_value: number;
  median_value: number;
  max_value: number;
}

/**
 * Calcula o percentual de posição salarial usando a fórmula de 3 casos:
 * - Abaixo do mínimo: ((min / salary) - 1) * 100 (% de aumento necessário)
 * - Dentro da faixa: ((salary - min) / (max - min)) * 100 (0% a 100%, onde 50% = Média de Mercado)
 * - Acima do máximo: (salary / max) * 100 (>100%)
 */
export const calculateSalaryRangePercentage = (
  salary: number,
  range: SalaryRange
): number => {
  const { min_value, median_value, max_value } = range;

  // CASO 1: Abaixo do mínimo (% de aumento necessário para atingir o mínimo - VALOR NEGATIVO)
  if (salary < min_value) {
    return -((min_value / salary) - 1) * 100;
  }
  
  // CASO 2: Dentro da faixa (0% a 100%, onde 50% = Média de Mercado)
  else if (salary >= min_value && salary <= max_value) {
    return ((salary - min_value) / (max_value - min_value)) * 100;
  }
  
  // CASO 3: Acima do máximo (percentual em relação ao teto)
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
  } else if (percentage < 40) {
    return { 
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300', 
      label: '📊 Início da Faixa (Abaixo do Mercado)' 
    };
  } else if (percentage < 60) {
    return { 
      color: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300', 
      label: '✅ Próximo ao Mercado (50% = Mercado)' 
    };
  } else if (percentage <= 100) {
    return { 
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300', 
      label: '🔸 Acima do Mercado' 
    };
  } else {
    return { 
      color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300', 
      label: '🔴 Acima da Faixa' 
    };
  }
};
