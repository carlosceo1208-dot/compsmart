import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface INPCResponse {
  monthly: number;
  accumulated: number;
  period: string;
  referenceMonth: string;
  source: 'ibge' | 'cache' | 'fallback';
}

const FALLBACK_INPC: INPCResponse = {
  monthly: 0.48,
  accumulated: 4.77,
  period: '12 meses',
  referenceMonth: 'Janeiro/2025',
  source: 'fallback',
};

const formatReferenceMonth = (period: string): string => {
  const year = period.substring(0, 4);
  const month = parseInt(period.substring(4, 6)) - 1;
  
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  return `${monthNames[month]}/${year}`;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // SECURITY: Require CRON_SECRET for scheduled invocations
  const cronSecret = Deno.env.get('CRON_SECRET');
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(req.url);
    const months = parseInt(url.searchParams.get('months') || '12');
    
    // Tentar buscar dados do IBGE
    let inpcData: INPCResponse;
    
    try {
      console.log('Fetching INPC from IBGE API...');
      
      const response = await fetch(
        `https://servicodados.ibge.gov.br/api/v3/agregados/1736/periodos/-${months}/variaveis/44?localidades=N1[all]`,
        { 
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(15000) // 15s timeout
        }
      );
      
      if (!response.ok) {
        throw new Error(`IBGE API error: ${response.status}`);
      }
      
      const data = await response.json();
      const series = data[0]?.resultados[0]?.series[0];
      
      if (!series) {
        throw new Error('Invalid INPC data structure');
      }
      
      const periods = Object.keys(series.serie);
      const latestPeriod = periods[periods.length - 1];
      const values = Object.values(series.serie).map((v) => parseFloat(v as string));
      
      // Calcular acumulado
      const accumulated = values.reduce((acc, val) => {
        return ((1 + acc / 100) * (1 + val / 100) - 1) * 100;
      }, 0);
      
      inpcData = {
        monthly: values[values.length - 1],
        accumulated: Math.round(accumulated * 100) / 100,
        period: `${months} meses`,
        referenceMonth: formatReferenceMonth(latestPeriod),
        source: 'ibge',
      };
      
      console.log('INPC fetched successfully:', inpcData);
      
      // Salvar no banco para cache
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Upsert INPC mensal
      await supabase
        .from('economic_parameters')
        .upsert({
          parameter_key: 'inpc_monthly',
          value: inpcData.monthly,
          effective_date: new Date().toISOString().split('T')[0],
          metadata: {
            accumulated: inpcData.accumulated,
            period: inpcData.period,
            referenceMonth: inpcData.referenceMonth,
            months: months,
            fetchedAt: new Date().toISOString(),
          },
        }, {
          onConflict: 'parameter_key,effective_date',
        });
      
      console.log('INPC cached in database');
      
    } catch (ibgeError) {
      console.warn('IBGE API failed, using fallback:', ibgeError);
      
      // Tentar buscar do cache (banco de dados)
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: cached } = await supabase
        .from('economic_parameters')
        .select('*')
        .eq('parameter_key', 'inpc_monthly')
        .order('effective_date', { ascending: false })
        .limit(1)
        .single();
      
      if (cached && cached.metadata) {
        const metadata = cached.metadata as Record<string, unknown>;
        inpcData = {
          monthly: Number(cached.value),
          accumulated: Number(metadata.accumulated) || 0,
          period: String(metadata.period) || '12 meses',
          referenceMonth: String(metadata.referenceMonth) || 'N/A',
          source: 'cache',
        };
        console.log('Using cached INPC:', inpcData);
      } else {
        // Fallback estático
        inpcData = FALLBACK_INPC;
        console.log('Using static fallback INPC');
      }
    }
    
    return new Response(JSON.stringify(inpcData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Edge function error:', error);
    
    // Sempre retornar fallback em caso de erro
    return new Response(JSON.stringify(FALLBACK_INPC), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
