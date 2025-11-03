export interface USDData {
  value: number;
  variation: number;
  percentChange: number;
  lastUpdate: Date;
}

export interface INPCData {
  monthly: number;
  accumulated: number;
  period: string;
  referenceMonth: string;
}

export interface EconomicData {
  usd: USDData | null;
  inpc: INPCData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  refetchUsd: () => void;
  refetchInpc: () => void;
}

export type Currency = 'BRL' | 'USD';

export interface CurrencyConverter {
  currency: Currency;
  setCurrency: (curr: Currency) => void;
  convert: (value: number, from: Currency, to?: Currency) => number;
  exchangeRate: number | null;
}
