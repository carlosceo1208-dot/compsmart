import { useQuery } from '@tanstack/react-query';
import { EconomicData, USDData, INPCData, MinimumWageData } from '@/types/economic';
import { supabase } from '@/integrations/supabase/client';
import { getBrazilDateString } from '@/lib/timezone';

// Fallback para salário mínimo caso o banco esteja indisponível
const FALLBACK_MINIMUM_WAGE: MinimumWageData = {
  value: 1621.00,
  effectiveDate: '01/01/2026',
  year: 2026,
};

const fetchMinimumWage = async (): Promise<MinimumWageData> => {
  try {
    const today = getBrazilDateString();
    
    const { data, error } = await supabase
      .from('economic_parameters')
      .select('*')
      .eq('parameter_key', 'minimum_wage')
      .lte('effective_date', today)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
      console.warn('Erro ao buscar salário mínimo do banco, usando fallback:', error);
      return FALLBACK_MINIMUM_WAGE;
    }
    
    const effectiveDate = new Date(data.effective_date);
    const metadata = data.metadata as { year?: number } | null;
    
    return {
      value: Number(data.value),
      effectiveDate: effectiveDate.toLocaleDateString('pt-BR'),
      year: metadata?.year || effectiveDate.getFullYear(),
    };
  } catch (error) {
    console.error('Falha ao buscar salário mínimo:', error);
    return FALLBACK_MINIMUM_WAGE;
  }
};

const fetchUSDRate = async (): Promise<USDData> => {
  try {
    // Tentar AwesomeAPI primeiro
    const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
    if (!response.ok) throw new Error('AwesomeAPI indisponível');
    
    const data = await response.json();
    const usdData = data.USDBRL;
    
    const result = {
      value: parseFloat(usdData.bid),
      variation: parseFloat(usdData.varBid),
      percentChange: parseFloat(usdData.pctChange),
      lastUpdate: new Date(parseInt(usdData.timestamp) * 1000),
    };
    
    // Salvar no cache
    localStorage.setItem('usd-cache', JSON.stringify(result));
    localStorage.setItem('usd-cache-time', Date.now().toString());
    
    return result;
  } catch (error) {
    console.warn('AwesomeAPI falhou, verificando cache...');
    
    // Tentar usar cache (máximo 1 hora de idade)
    const cached = localStorage.getItem('usd-cache');
    const cacheTime = localStorage.getItem('usd-cache-time');
    
    if (cached && cacheTime) {
      const age = Date.now() - parseInt(cacheTime);
      if (age < 60 * 60 * 1000) { // 1 hora
        console.info('Usando cache do USD');
        const parsedCache = JSON.parse(cached);
        // Converter lastUpdate de string para Date
        return {
          ...parsedCache,
          lastUpdate: new Date(parsedCache.lastUpdate)
        };
      }
    }
    
    // Fallback: API do Banco Central
    try {
      console.warn('Cache expirado, tentando Banco Central...');
      const today = new Date();
      const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}-${today.getFullYear()}`;
      
      const bcResponse = await fetch(
        `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${dateStr}'&$format=json`
      );
      
      if (!bcResponse.ok) throw new Error('Banco Central indisponível');
      
      const bcData = await bcResponse.json();
      
      if (!bcData.value || bcData.value.length === 0) {
        throw new Error('Sem dados do Banco Central');
      }
      
      const result = {
        value: parseFloat(bcData.value[0].cotacaoVenda),
        variation: 0,
        percentChange: 0,
        lastUpdate: new Date(bcData.value[0].dataHoraCotacao || new Date()),
      };
      
      // Salvar no cache
      localStorage.setItem('usd-cache', JSON.stringify(result));
      localStorage.setItem('usd-cache-time', Date.now().toString());
      
      console.info('Usando dados do Banco Central');
      return result;
    } catch (bcError) {
      console.error('Todas as fontes de cotação falharam:', bcError);
      throw new Error('Cotação do dólar indisponível');
    }
  }
};

const formatReferenceMonth = (period: string): string => {
  // period vem como "YYYYMM" (ex: "202409")
  const year = period.substring(0, 4);
  const month = parseInt(period.substring(4, 6)) - 1; // 0-indexed
  
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  return `${monthNames[month]}/${year}`;
};

const fetchINPCData = async (months: number = 12): Promise<INPCData> => {
  const cacheKey = `inpc-cache-${months}`;
  const cacheTimeKey = `inpc-cache-time-${months}`;
  
  try {
    // IBGE SIDRA API - Tabela 1736 (INPC)
    const response = await fetch(
      `https://servicodados.ibge.gov.br/api/v3/agregados/1736/periodos/-${months}/variaveis/44?localidades=N1[all]`,
      { signal: AbortSignal.timeout(10000) } // 10s timeout
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
    
    const result: INPCData = {
      monthly: values[values.length - 1],
      accumulated: accumulated,
      period: `${months} meses`,
      referenceMonth: formatReferenceMonth(latestPeriod),
    };
    
    // Salvar no cache
    localStorage.setItem(cacheKey, JSON.stringify(result));
    localStorage.setItem(cacheTimeKey, Date.now().toString());
    
    return result;
  } catch (error) {
    console.warn('IBGE API falhou, verificando cache...', error);
    
    // Tentar usar cache (máximo 24 horas de idade)
    const cached = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(cacheTimeKey);
    
    if (cached && cacheTime) {
      const age = Date.now() - parseInt(cacheTime);
      if (age < 24 * 60 * 60 * 1000) { // 24 horas
        console.info('Usando cache do INPC');
        return JSON.parse(cached);
      }
    }
    
    // Se não houver cache válido, lançar erro
    throw new Error('INPC data unavailable');
  }
};

export const useEconomicData = (inpcMonths: number = 12) => {
  const usdQuery = useQuery({
    queryKey: ['usd-rate'],
    queryFn: fetchUSDRate,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: (query) => {
      // Circuit breaker: parar polling automático em caso de erro
      return query.state.error ? false : 5 * 60 * 1000;
    },
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const inpcQuery = useQuery({
    queryKey: ['inpc-data', inpcMonths],
    queryFn: () => fetchINPCData(inpcMonths),
    staleTime: 6 * 60 * 60 * 1000, // 6 horas - INPC não muda frequentemente
    gcTime: 24 * 60 * 60 * 1000, // manter em cache por 24h
    refetchInterval: (query) => {
      return query.state.error ? false : 6 * 60 * 60 * 1000;
    },
    retry: 3, // 3 tentativas
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // backoff exponencial
    refetchOnWindowFocus: false,
  });

  const minimumWageQuery = useQuery({
    queryKey: ['minimum-wage'],
    queryFn: fetchMinimumWage,
    staleTime: 24 * 60 * 60 * 1000, // 24 horas - valor não muda frequentemente
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const economicData: EconomicData = {
    usd: usdQuery.data || null,
    inpc: inpcQuery.data || null,
    minimumWage: minimumWageQuery.data || FALLBACK_MINIMUM_WAGE,
    isLoading: usdQuery.isLoading || inpcQuery.isLoading || minimumWageQuery.isLoading,
    isRefreshing: usdQuery.isFetching || inpcQuery.isFetching || minimumWageQuery.isFetching,
    error: usdQuery.error || inpcQuery.error || null,
    refetchUsd: () => usdQuery.refetch(),
    refetchInpc: () => inpcQuery.refetch(),
  };

  return economicData;
};
