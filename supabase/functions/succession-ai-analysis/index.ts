import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Successor {
  name: string;
  currentRole: string;
  currentGrade: string;
  rank: number;
  readiness: string;
  latestScore: number | null;
  latestPotential: number | null;
  strengths: string | null;
  improvementAreas: string | null;
  evaluationCount: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    // ============ AUTENTICAÇÃO OBRIGATÓRIA (multi-tenant) ============
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Autorização necessária' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============ ROLE AUTHORIZATION ============
    const { data: callerRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    const allowedRoles = ['admin', 'hr_manager', 'super_admin'];
    const hasAccess = (callerRoles || []).some((r: any) => allowedRoles.includes(r.role));
    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============ RATE LIMITING ============
    const { data: allowed } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_function_name: 'succession-ai-analysis',
      p_max_requests: 30,
      p_window_minutes: 60
    });

    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Limite de requisições excedido. Aguarde alguns minutos.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      positionTitle, 
      positionGrade, 
      positionSummary, 
      positionSkills,
      successors 
    } = await req.json();

    // Validação básica de input
    if (!positionTitle || typeof positionTitle !== 'string' || positionTitle.length > 500) {
      return new Response(
        JSON.stringify({ error: 'positionTitle inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!successors || !Array.isArray(successors) || successors.length === 0) {
      return new Response(
        JSON.stringify({ analysis: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limitar quantidade de sucessores para evitar abuso
    const limitedSuccessors = successors.slice(0, 20);

    const readinessLabels: Record<string, string> = {
      ready_now: "Pronto Agora",
      ready_1_year: "Pronto em 1 Ano",
      ready_2_years: "Pronto em 2 Anos",
      development: "Em Desenvolvimento",
    };

    // Format successors for prompt
    const successorsInfo = limitedSuccessors.map((s: Successor) => {
      const score9Box = s.latestScore !== null && s.latestPotential !== null
        ? `Score: ${s.latestScore.toFixed(1)}/5, Potencial: ${s.latestPotential.toFixed(1)}/5`
        : "Sem avaliações aprovadas";
      
      return `
**${s.rank}º - ${s.name}**
- Cargo Atual: ${s.currentRole} (Grade ${s.currentGrade})
- Prontidão: ${readinessLabels[s.readiness] || s.readiness}
- ${score9Box}
- Avaliações: ${s.evaluationCount} ciclos
${s.strengths ? `- Pontos Fortes: ${s.strengths}` : ''}
${s.improvementAreas ? `- Áreas de Melhoria: ${s.improvementAreas}` : ''}`;
    }).join('\n');

    const systemPrompt = `Você é o PerformAI, especialista em gestão de talentos e planejamento de sucessão da plataforma CompSmart.

Analise os candidatos à sucessão para uma posição-chave e forneça uma recomendação estratégica.

IMPORTANTE:
- Seja objetivo e direto (máximo 150 palavras)
- Destaque o candidato mais recomendado com base em dados concretos
- Considere: performance, potencial, prontidão e gap de grade
- Use emojis para destacar pontos (🏆 para recomendação, ⚠️ para atenção, 💡 para insight)
- NÃO use markdown headers (#), apenas **negrito** para destaques

ESCALA 9BOX:
- Baixo: < 1.67 | Médio: 1.67-3.33 | Alto: > 3.33

Retorne uma análise concisa e acionável para tomada de decisão.`;

    const userPrompt = `## POSIÇÃO-CHAVE A SER SUCEDIDA

**${positionTitle}** (Grade ${positionGrade})
${positionSummary ? `Sumário: ${positionSummary}` : ''}
${positionSkills ? `Competências: ${positionSkills}` : ''}

## CANDIDATOS MAPEADOS

${successorsInfo}

---

Analise os candidatos e recomende o melhor para a sucessão, justificando sua escolha com base nos dados de performance, potencial e prontidão.`;

    console.log(`[succession-ai-analysis] User ${user.id} analyzing ${limitedSuccessors.length} successors`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições da IA atingido. Tente novamente em instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos de IA esgotados. Entre em contato com o administrador.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content;

    if (!analysis) {
      throw new Error('Resposta vazia da IA');
    }

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in succession-ai-analysis:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
