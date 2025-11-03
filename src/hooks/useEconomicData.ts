import { useQuery } from '@tanstack/react-query';
import { EconomicData, USDData, INPCData } from '@/types/economic';

const fetchUSDRate = async (): Promise<USDData> => {
  const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
  if (!response.ok) throw new Error('Failed to fetch USD rate');
  
  const data = await response.json();
  const usdData = data.USDBRL;
  
  return {
    value: parseFloat(usdData.bid),
    variation: parseFloat(usdData.varBid),
    percentChange: parseFloat(usdData.pctChange),
    lastUpdate: new Date(parseInt(usdData.timestamp) * 1000),
  };
};

const fetchINPCData = async (months: number = 12): Promise<INPCData> => {
  // IBGE SIDRA API - Tabela 1736 (INPC)
  const response = await fetch(
    `https://servicodados.ibge.gov.br/api/v3/agregados/1736/periodos/-${months}/variaveis/44?localidades=N1[all]`
  );
  
  if (!response.ok) throw new Error('Failed to fetch INPC data');
  
  const data = await response.json();
  const series = data[0]?.resultados[0]?.series[0];
  
  if (!series) throw new Error('Invalid INPC data structure');
  
  const periods = Object.keys(series.serie);
  const latestPeriod = periods[periods.length - 1];
  const values = Object.values(series.serie).map(v => parseFloat(v as string));
  
  // Calcular acumulado
  const accumulated = values.reduce((acc, val) => {
    return ((1 + acc / 100) * (1 + val / 100) - 1) * 100;
  }, 0);
  
  return {
    monthly: values[values.length - 1],
    accumulated: accumulated,
    period: `${months} meses`,
    referenceMonth: latestPeriod,
  };
};

export const useEconomicData = (inpcMonths: number = 12) => {
  const usdQuery = useQuery({
    queryKey: ['usd-rate'],
    queryFn: fetchUSDRate,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 5 * 60 * 1000, // Atualiza a cada 5 minutos
    retry: 2,
  });

  const inpcQuery = useQuery({
    queryKey: ['inpc-data', inpcMonths],
    queryFn: () => fetchINPCData(inpcMonths),
    staleTime: 24 * 60 * 60 * 1000, // 24 horas
    retry: 2,
  });

  const economicData: EconomicData = {
    usd: usdQuery.data || null,
    inpc: inpcQuery.data || null,
    isLoading: usdQuery.isLoading || inpcQuery.isLoading,
    error: usdQuery.error || inpcQuery.error || null,
  };

  return economicData;
};
