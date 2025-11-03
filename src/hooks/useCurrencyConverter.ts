import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Currency, CurrencyConverter } from '@/types/economic';

const fetchExchangeRate = async (): Promise<number> => {
  const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
  if (!response.ok) throw new Error('Failed to fetch exchange rate');
  
  const data = await response.json();
  return parseFloat(data.USDBRL.bid);
};

export const useCurrencyConverter = (): CurrencyConverter => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('compSmart-currency');
    return (saved as Currency) || 'BRL';
  });

  const { data: exchangeRate } = useQuery({
    queryKey: ['usd-rate'], // Usar mesma queryKey para compartilhar cache
    queryFn: fetchExchangeRate,
    staleTime: 60 * 60 * 1000, // 1 hora
    refetchInterval: false, // Não fazer polling (deixar useEconomicData gerenciar)
    retry: 2,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    localStorage.setItem('compSmart-currency', currency);
  }, [currency]);

  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr);
  };

  const convert = (value: number, from: Currency, to?: Currency): number => {
    const targetCurrency = to || currency;
    
    if (from === targetCurrency) return value;
    if (!exchangeRate) return value;
    
    // BRL para USD
    if (from === 'BRL' && targetCurrency === 'USD') {
      return value / exchangeRate;
    }
    
    // USD para BRL
    if (from === 'USD' && targetCurrency === 'BRL') {
      return value * exchangeRate;
    }
    
    return value;
  };

  return {
    currency,
    setCurrency,
    convert,
    exchangeRate: exchangeRate || null,
  };
};
