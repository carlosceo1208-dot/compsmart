/**
 * Utility functions for formatting values in analytics displays
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

export const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !isFinite(value)) return '0';
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !isFinite(value)) return '0%';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
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
