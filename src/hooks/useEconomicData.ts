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

// Fallback estático para INPC (Janeiro/2025)
const FALLBACK_INPC: INPCData = {
  monthly: 0.48,
  accumulated: 4.77,
  period: '12 meses',
  referenceMonth: 'Janeiro/2025',
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

// ESTRATÉGIA DE 3 CAMADAS PARA INPC
const fetchINPCData = async (months: number = 12): Promise<INPCData> => {
  const cacheKey = `inpc-cache-${months}`;
  const cacheTimeKey = `inpc-cache-time-${months}`;
  
  // CAMADA 1: Tentar Edge Function (proxy para IBGE)
  try {
    console.log('Tentando Edge Function fetch-inpc...');
    
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(
      `https://fpkjkqdfufhhicxkyqdw.supabase.co/functions/v1/fetch-inpc?months=${months}`,
      {
        headers: {
          'Authorization': `Bearer ${session?.access_token || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwa2prcWRmdWZoaGljeGt5cWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMTc5NzEsImV4cCI6MjA3Njc5Mzk3MX0.0TUvEi7IA7_k8urXb46xBb9NbyWwu1PBS2dWOStocBM'}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Edge function error: ${response.status}`);
    }
    
    const data = await response.json();
    
    const result: INPCData = {
      monthly: data.monthly,
      accumulated: data.accumulated,
      period: data.period,
      referenceMonth: data.referenceMonth,
    };
    
    // Salvar no cache local
    localStorage.setItem(cacheKey, JSON.stringify(result));
    localStorage.setItem(cacheTimeKey, Date.now().toString());
    
    console.log('INPC obtido via Edge Function:', result);
    return result;
    
  } catch (edgeError) {
    console.warn('Edge Function falhou:', edgeError);
  }
  
  // CAMADA 2: Tentar banco de dados
  try {
    console.log('Tentando buscar INPC do banco de dados...');
    
    const { data: cached } = await supabase
      .from('economic_parameters')
      .select('*')
      .eq('parameter_key', 'inpc_monthly')
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();
    
    if (cached && cached.metadata) {
      const metadata = cached.metadata as Record<string, unknown>;
      const result: INPCData = {
        monthly: Number(cached.value),
        accumulated: Number(metadata.accumulated) || FALLBACK_INPC.accumulated,
        period: String(metadata.period) || FALLBACK_INPC.period,
        referenceMonth: String(metadata.referenceMonth) || FALLBACK_INPC.referenceMonth,
      };
      
      console.log('INPC obtido do banco:', result);
      return result;
    }
  } catch (dbError) {
    console.warn('Banco de dados falhou:', dbError);
  }
  
  // CAMADA 2.5: Tentar cache local
  const cached = localStorage.getItem(cacheKey);
  const cacheTime = localStorage.getItem(cacheTimeKey);
  
  if (cached && cacheTime) {
    const age = Date.now() - parseInt(cacheTime);
    if (age < 7 * 24 * 60 * 60 * 1000) { // 7 dias
      console.info('Usando cache local do INPC');
      return JSON.parse(cached);
    }
  }
  
  // CAMADA 3: Fallback estático (nunca falha)
  console.log('Usando fallback estático do INPC');
  return FALLBACK_INPC;
};

export const useEconomicData = (inpcMonths: number = 12) => {
  const usdQuery = useQuery({
    queryKey: ['usd-rate'],
    queryFn: fetchUSDRate,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: (query) => {
      return query.state.error ? false : 5 * 60 * 1000;
    },
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const inpcQuery = useQuery({
    queryKey: ['inpc-data', inpcMonths],
    queryFn: () => fetchINPCData(inpcMonths),
    staleTime: 6 * 60 * 60 * 1000, // 6 horas
    gcTime: 24 * 60 * 60 * 1000, // 24h
    refetchInterval: false, // Não fazer polling, dados mudam mensalmente
    retry: 1, // Menos retries pois temos fallback
    refetchOnWindowFocus: false,
  });

  const minimumWageQuery = useQuery({
    queryKey: ['minimum-wage'],
    queryFn: fetchMinimumWage,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const economicData: EconomicData = {
    usd: usdQuery.data || null,
    // INPC agora SEMPRE terá valor (fallback estático garante)
    inpc: inpcQuery.data || FALLBACK_INPC,
    minimumWage: minimumWageQuery.data || FALLBACK_MINIMUM_WAGE,
    isLoading: usdQuery.isLoading || inpcQuery.isLoading || minimumWageQuery.isLoading,
    isRefreshing: usdQuery.isFetching || inpcQuery.isFetching || minimumWageQuery.isFetching,
    error: usdQuery.error || null, // Ignorar erro do INPC pois temos fallback
    refetchUsd: () => usdQuery.refetch(),
    refetchInpc: () => inpcQuery.refetch(),
  };

  return economicData;
};
