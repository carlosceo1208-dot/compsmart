import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const today = new Date().toISOString().split('T')[0];
    const indicators: any[] = [];

    // 1. Cotação USD/BRL via AwesomeAPI (gratuita, sem key)
    try {
      const usdRes = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
      const usdData = await usdRes.json();
      const usdValue = parseFloat(usdData.USDBRL?.bid || '0');
      if (usdValue > 0) {
        indicators.push({
          indicator_key: 'USD_BRL',
          indicator_value: usdValue,
          reference_date: today,
          metadata: { 
            high: usdData.USDBRL.high, 
            low: usdData.USDBRL.low,
            pctChange: usdData.USDBRL.pctChange 
          },
          source: 'AwesomeAPI',
        });
      }
    } catch (e) {
      console.error('USD fetch failed', e);
    }

    // 2. INPC via BCB SGS (série 188)
    try {
      const inpcRes = await fetch(
        'https://api.bcb.gov.br/dados/serie/bcdata.sgs.188/dados/ultimos/12?formato=json'
      );
      const inpcData = await inpcRes.json();
      if (Array.isArray(inpcData) && inpcData.length > 0) {
        const last = inpcData[inpcData.length - 1];
        const monthValue = parseFloat(last.valor);
        const accumulated12m = inpcData.reduce(
          (acc: number, item: any) => acc * (1 + parseFloat(item.valor) / 100),
          1
        );
        const accumPct = (accumulated12m - 1) * 100;

        indicators.push({
          indicator_key: 'INPC_MONTH',
          indicator_value: monthValue,
          reference_date: today,
          metadata: { reference_period: last.data },
          source: 'BCB',
        });
        indicators.push({
          indicator_key: 'INPC_12M',
          indicator_value: parseFloat(accumPct.toFixed(2)),
          reference_date: today,
          metadata: { months: 12 },
          source: 'BCB',
        });
      }
    } catch (e) {
      console.error('INPC fetch failed', e);
    }

    // Upsert
    if (indicators.length > 0) {
      const { error } = await supabase
        .from('executive_dashboard_indicators')
        .upsert(indicators, { onConflict: 'indicator_key,reference_date' });
      if (error) throw error;
    }

    return new Response(
      JSON.stringify({ success: true, count: indicators.length, indicators }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
