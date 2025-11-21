/**
 * @module formatters
 * @description Funções centralizadas para formatação de valores monetários e numéricos
 * 
 * ⚠️ IMPORTANTE: Sempre use estas funções ao invés de toLocaleString, toFixed ou Intl.NumberFormat direto
 * 
 * @example
 * // ✅ Correto
 * import { formatCurrency } from '@/lib/formatters';
 * const display = formatCurrency(1234.56); // "R$ 1.234,56"
 * 
 * @example
 * // ❌ EVITE
 * const display = value.toLocaleString('pt-BR'); // Pode causar RangeError
 */

/**
 * Tipos de formatação monetária suportados
 */
export type CurrencyFormat = 'full' | 'compact' | 'no-decimals' | 'custom';

/**
 * Opções de formatação customizada
 */
export interface FormatCurrencyOptions {
  currency?: 'BRL' | 'USD';
  decimals?: number;
  compact?: boolean;
  includeSymbol?: boolean;
}

/**
 * Formata valor como moeda brasileira com 2 casas decimais
 * @param value - Valor a ser formatado
 * @returns String formatada (ex: "R$ 1.234,56")
 */
export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !isFinite(value)) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Formata valor como moeda compacta (K/M)
 * @param value - Valor a ser formatado
 * @returns String formatada (ex: "R$ 1.2M")
 */
export const formatCompactCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !isFinite(value)) return 'R$ 0';
  
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(1)}K`;
  }
  return formatCurrency(value);
};

/**
 * Formata moeda sem casas decimais
 * @param value - Valor a ser formatado
 * @returns String formatada (ex: "R$ 1.234")
 */
export const formatCurrencyNoDecimals = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !isFinite(value)) return 'R$ 0';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Formata número inteiro sem decimais
 * @param value - Valor a ser formatado
 * @returns String formatada (ex: "1.234")
 */
export const formatInteger = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !isFinite(value)) return '0';
  return Math.round(value).toLocaleString('pt-BR');
};

/**
 * Formata número como contador simples
 * @param value - Valor a ser formatado
 * @returns String formatada (ex: "42")
 */
export const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !isFinite(value)) return '0';
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Formata decimal com precisão específica
 * @param value - Valor a ser formatado
 * @param decimals - Número de casas decimais (0-20)
 * @returns String formatada (ex: "3,142")
 */
export const formatDecimal = (
  value: number | null | undefined, 
  decimals: number = 2
): string => {
  if (value === null || value === undefined || !isFinite(value)) return '0';
  
  // Validar decimals para prevenir RangeError
  const safeDecimals = Math.max(0, Math.min(20, Math.floor(decimals)));
  
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: safeDecimals,
    maximumFractionDigits: safeDecimals,
  });
};

/**
 * Formata porcentagem com validação
 * @param value - Valor a ser formatado (já em %)
 * @returns String formatada (ex: "12,5%")
 */
export const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !isFinite(value)) return '0%';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

/**
 * Formata porcentagem com opções avançadas
 * @param value - Valor a ser formatado
 * @param decimals - Número de casas decimais
 * @param includeSign - Incluir sinal + para positivos
 * @returns String formatada (ex: "+12,5%")
 */
export const formatPercentageSafe = (
  value: number | null | undefined,
  decimals: number = 1,
  includeSign: boolean = false
): string => {
  if (value === null || value === undefined || !isFinite(value)) return '0%';
  
  const safeDecimals = Math.max(0, Math.min(20, Math.floor(decimals)));
  const sign = includeSign && value > 0 ? '+' : '';
  
  return `${sign}${value.toLocaleString('pt-BR', {
    minimumFractionDigits: safeDecimals,
    maximumFractionDigits: safeDecimals,
  })}%`;
};

/**
 * Wrapper seguro para toFixed com validação
 * @param value - Valor a ser formatado
 * @param decimals - Número de casas decimais (0-20)
 * @returns String formatada (ex: "123.46")
 */
export const toFixedSafe = (
  value: number | null | undefined,
  decimals: number = 2
): string => {
  if (value === null || value === undefined || !isFinite(value)) return '0';
  
  const safeDecimals = Math.max(0, Math.min(20, Math.floor(decimals)));
  return value.toFixed(safeDecimals);
};

export const convertCurrency = (
  value: number, 
  from: 'BRL' | 'USD', 
  to: 'BRL' | 'USD', 
  rate: number
): number => {
  if (from === to) return value;
  return from === 'BRL' ? value / rate : value * rate;
};

/**
 * Formata moeda customizada (BRL ou USD)
 * @param value - Valor a ser formatado
 * @param currency - Moeda a usar
 * @returns String formatada
 */
export const formatCurrencyCustom = (
  value: number | null | undefined, 
  currency: 'BRL' | 'USD'
): string => {
  if (value === null || value === undefined || !isFinite(value)) return currency === 'BRL' ? 'R$ 0,00' : '$ 0.00';
  
  return new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Formatador universal com opções customizadas
 * @param value - Valor a ser formatado
 * @param options - Opções de formatação
 * @returns String formatada
 */
export const formatCurrencyWithOptions = (
  value: number | null | undefined,
  options: FormatCurrencyOptions = {}
): string => {
  if (value === null || value === undefined || !isFinite(value)) {
    return options.includeSymbol !== false 
      ? (options.currency === 'USD' ? '$ 0.00' : 'R$ 0,00')
      : '0';
  }
  
  const {
    currency = 'BRL',
    decimals = 2,
    compact = false,
    includeSymbol = true,
  } = options;
  
  if (compact) {
    return formatCompactCurrency(value);
  }
  
  const safeDecimals = Math.max(0, Math.min(20, Math.floor(decimals)));
  
  if (!includeSymbol) {
    return value.toLocaleString(currency === 'BRL' ? 'pt-BR' : 'en-US', {
      minimumFractionDigits: safeDecimals,
      maximumFractionDigits: safeDecimals,
    });
  }
  
  return new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: safeDecimals,
    maximumFractionDigits: safeDecimals,
  }).format(value);
};
