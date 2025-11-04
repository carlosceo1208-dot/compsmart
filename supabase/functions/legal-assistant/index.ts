import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user subscription plan
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('plan_type')
      .eq('user_id', user.id)
      .single();

    if (subscription?.plan_type !== 'pro') {
      return new Response(
        JSON.stringify({ error: 'Este recurso requer plano PRO' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { question } = await req.json();

    if (!question) {
      return new Response(
        JSON.stringify({ error: 'Pergunta não fornecida' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // TODO: Integrate with your AI webhook endpoint here
    // For now, returning a mock response
    const startTime = Date.now();
    
    const mockAnswer = `Com base na legislação trabalhista brasileira (CLT), sobre sua pergunta: "${question}"

Esta é uma resposta de exemplo. Você deve configurar seu webhook de IA para processar consultas jurídicas reais.

Artigos relevantes da CLT:
- Art. 129 a 153 (Férias)
- Art. 457 a 467 (Remuneração)
- Art. 468 (Alteração contratual)

IMPORTANTE: Esta resposta é meramente informativa e não substitui a consulta a um advogado especializado.`;

    const responseTime = Date.now() - startTime;

    // Save conversation to database
    const { error: insertError } = await supabase
      .from('legal_assistant_conversations')
      .insert({
        user_id: user.id,
        question,
        answer: mockAnswer,
        legal_references: {
          articles: ['CLT Art. 129-153', 'CLT Art. 457-467', 'CLT Art. 468'],
        },
        tokens_used: 500,
        response_time_ms: responseTime,
      });

    if (insertError) {
      console.error('Error saving conversation:', insertError);
    }

    return new Response(
      JSON.stringify({
        answer: mockAnswer,
        legal_references: {
          articles: ['CLT Art. 129-153', 'CLT Art. 457-467', 'CLT Art. 468'],
        },
        tokens_used: 500,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in legal-assistant function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
