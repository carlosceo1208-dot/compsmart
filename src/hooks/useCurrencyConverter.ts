import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Currency, CurrencyConverter, USDData } from '@/types/economic';

const fetchUSDRate = async (): Promise<USDData> => {
  const cachedRate = localStorage.getItem('usd-rate-cache');
  const cacheTimestamp = localStorage.getItem('usd-rate-timestamp');
  
  if (cachedRate && cacheTimestamp) {
    const cacheAge = Date.now() - parseInt(cacheTimestamp);
    if (cacheAge < 60 * 60 * 1000) {
      return JSON.parse(cachedRate);
    }
  }

  try {
    const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
    if (!response.ok) throw new Error('Failed to fetch USD rate');
    
    const data = await response.json();
    const usdData = data.USDBRL;
    
    const result: USDData = {
      value: parseFloat(usdData.bid),
      variation: parseFloat(usdData.varBid),
      percentChange: parseFloat(usdData.pctChange),
      lastUpdate: new Date(parseInt(usdData.timestamp) * 1000),
    };
    
    localStorage.setItem('usd-rate-cache', JSON.stringify(result));
    localStorage.setItem('usd-rate-timestamp', Date.now().toString());
    
    return result;
  } catch (error) {
    console.error('Failed to fetch from AwesomeAPI, trying Banco Central fallback:', error);
    
    const bcbResponse = await fetch('https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao=%27' + 
      new Date().toISOString().split('T')[0] + '%27&$format=json');
    
    if (!bcbResponse.ok) {
      if (cachedRate) {
        console.warn('Using stale cache due to API failures');
        return JSON.parse(cachedRate);
      }
      throw new Error('All USD rate APIs failed');
    }
    
    const bcbData = await bcbResponse.json();
    const cotacao = bcbData.value[0];
    
    const result: USDData = {
      value: parseFloat(cotacao.cotacaoCompra),
      variation: 0,
      percentChange: 0,
      lastUpdate: new Date(cotacao.dataHoraCotacao),
    };
    
    localStorage.setItem('usd-rate-cache', JSON.stringify(result));
    localStorage.setItem('usd-rate-timestamp', Date.now().toString());
    
    return result;
  }
};

export const useCurrencyConverter = (): CurrencyConverter => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('compSmart-currency');
    return (saved as Currency) || 'BRL';
  });

  const { data: exchangeRate } = useQuery({
    queryKey: ['usd-rate'],
    queryFn: fetchUSDRate,
    select: (data) => data.value,
    staleTime: 60 * 60 * 1000,
    refetchInterval: false,
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
