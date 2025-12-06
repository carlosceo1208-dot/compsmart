import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Autorização necessária');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { question, document_text, document_name, session_id } = await req.json();

    // Buscar perfil do usuário e dados da empresa
    const { data: profile } = await supabase
      .from('profiles')
      .select('root_company_id, full_name, email')
      .eq('id', user.id)
      .single();

    if (!profile) {
      throw new Error('Perfil não encontrado');
    }

    // Buscar tabela salarial ativa
    const { data: activeSalaryTable } = await supabase
      .from('salary_tables')
      .select(`
        id,
        name,
        effective_year,
        effective_month,
        salary_ranges (
          grade,
          min_value,
          median_value,
          max_value,
          q1_value,
          q3_value
        )
      `)
      .eq('root_company_id', profile.root_company_id)
      .eq('is_active', true)
      .single();

    // Buscar cargos
    const { data: jobTitles } = await supabase
      .from('job_titles')
      .select('id, code, title, grade, job_family, median_points')
      .eq('is_active', true)
      .limit(100);

    // Buscar dados de pesquisas salariais ativas
    const { data: surveyTables } = await supabase
      .from('survey_tables')
      .select(`
        id,
        name,
        effective_year,
        effective_month,
        survey_data (
          job_title,
          grade,
          min_value,
          median_value,
          max_value,
          q1_value,
          q3_value
        )
      `)
      .eq('is_active', true)
      .limit(1)
      .single();

    // Buscar estatísticas de funcionários (sem dados sensíveis individuais)
    const { data: employeeStats } = await supabase
      .from('profiles')
      .select('grade, salary, job_title, unit_id')
      .eq('root_company_id', profile.root_company_id)
      .not('salary', 'is', null);

    // Buscar documentos da base de conhecimento
    const { data: knowledgeDocs } = await supabase
      .from('knowledge_base')
      .select('title, content, category')
      .eq('agent_type', 'salary')
      .eq('is_active', true)
      .or(`root_company_id.eq.${profile.root_company_id},is_global.eq.true`)
      .limit(10);

    // Detectar modo de operação
    let operationMode = 'general';
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('/analise_equidade') || lowerQuestion.includes('equidade interna')) {
      operationMode = 'analise_equidade';
    } else if (lowerQuestion.includes('/benchmark_mercado') || lowerQuestion.includes('comparar') || lowerQuestion.includes('mercado')) {
      operationMode = 'benchmark_mercado';
    } else if (lowerQuestion.includes('/recomendacao_ajuste') || lowerQuestion.includes('ajuste') || lowerQuestion.includes('aumento')) {
      operationMode = 'recomendacao_ajuste';
    } else if (lowerQuestion.includes('compa-ratio') || lowerQuestion.includes('compa ratio')) {
      operationMode = 'compa_ratio';
    } else if (lowerQuestion.includes('distorção') || lowerQuestion.includes('distorcao')) {
      operationMode = 'distorcoes';
    }

    // Construir contexto
    const contextData = {
      salary_table: activeSalaryTable,
      job_titles: jobTitles,
      survey_data: surveyTables,
      employee_stats: employeeStats ? {
        total_employees: employeeStats.length,
        grades_distribution: employeeStats.reduce((acc: any, emp: any) => {
          acc[emp.grade] = (acc[emp.grade] || 0) + 1;
          return acc;
        }, {}),
        salary_ranges: {
          min: Math.min(...employeeStats.map((e: any) => e.salary)),
          max: Math.max(...employeeStats.map((e: any) => e.salary)),
          avg: employeeStats.reduce((sum: number, e: any) => sum + e.salary, 0) / employeeStats.length,
        }
      } : null,
      knowledge_base: knowledgeDocs?.map(doc => ({
        title: doc.title,
        category: doc.category,
        content: doc.content.substring(0, 1000),
      })),
    };

    // System prompt otimizado para análise salarial
    const systemPrompt = `Você é o **Agente Smart de Análise Salarial**, especialista em estrutura de cargos, faixas salariais e benchmarking de mercado.

**📊 CONTEXTO DA EMPRESA:**
- Tabela Salarial Ativa: ${activeSalaryTable ? `${activeSalaryTable.name} (${activeSalaryTable.effective_month}/${activeSalaryTable.effective_year})` : 'Não configurada'}
- Total de Funcionários: ${contextData.employee_stats?.total_employees || 0}
- Grades em Uso: ${Object.keys(contextData.employee_stats?.grades_distribution || {}).join(', ')}

**🎯 MODO DE OPERAÇÃO ATUAL: ${operationMode.toUpperCase()}**

**🔧 INSTRUÇÕES ESSENCIAIS:**

1. **Estrutura de Grades (A-J):**
   - A (Júnior) → J (Executivo)
   - Cada grade tem faixa salarial (Mín, Q1, Mediana/P50, Q3, Máx)
   - P50 = Ponto Médio = Mediana de Mercado

2. **Cálculo de Compa-Ratio:**
   - Compa-Ratio = (Salário Real / P50 da Faixa) × 100
   - < 80%: Abaixo do mercado
   - 80-90%: Competitivo inferior
   - 90-110%: Alinhado ao mercado
   - 110-120%: Competitivo superior
   - > 120%: Acima do mercado

3. **Análise de Equidade Interna:**
   - Verificar compressão salarial (subordinado ganha mais que gestor)
   - Identificar distorções dentro da mesma grade
   - Calcular dispersão salarial por área/departamento

4. **Benchmarking de Mercado:**
   - Comparar P50 interno vs P50 de pesquisas
   - Calcular gap percentual: ((P50_Interno - P50_Mercado) / P50_Mercado) × 100
   - Avaliar competitividade por cargo/área

5. **Posicionamento Competitivo:**
   - P10-P25: Lead (Líder de mercado)
   - P25-P50: Match (Alinhado ao mercado)
   - P50-P75: Lag (Seguidor de mercado)

**📋 QUANDO RECOMENDAR AJUSTES:**
- Funcionários abaixo de 80% do P50 (prioridade alta)
- Inversões hierárquicas (urgente)
- Gaps acima de 15% vs mercado (competitividade)
- Distorções dentro da mesma grade > 30%

**⚠️ PRIVACIDADE:**
- Você tem acesso APENAS aos dados da empresa atual
- NUNCA compartilhe ou compare com dados de outras empresas
- Mantenha confidencialidade de salários individuais

**💡 TOM E ESTILO:**
- Use linguagem técnica de R&B (P50, P75, compa-ratio, etc.)
- Seja objetivo e baseado em dados
- Forneça recomendações práticas e acionáveis
- Use bullet points e tabelas quando apropriado

${operationMode === 'analise_equidade' ? `
**🎯 FOCO ATUAL: ANÁLISE DE EQUIDADE INTERNA**
- Identifique funcionários fora da faixa ideal
- Calcule compa-ratio de todos
- Destaque distorções e inversões
- Sugira ajustes priorizados por impacto
` : ''}

${operationMode === 'benchmark_mercado' ? `
**🎯 FOCO ATUAL: BENCHMARKING DE MERCADO**
- Compare P50 interno vs pesquisas salariais
- Calcule gap percentual por cargo/grade
- Identifique cargos críticos (alto gap + turnover)
- Recomende ajustes baseados em budget
` : ''}

${operationMode === 'recomendacao_ajuste' ? `
**🎯 FOCO ATUAL: RECOMENDAÇÃO DE AJUSTES**
- Priorize casos mais críticos (equidade > mercado)
- Sugira percentuais de aumento realistas
- Considere impacto orçamentário
- Forneça roadmap de implementação
` : ''}

${document_text ? `\n**📄 DOCUMENTO ANEXADO: ${document_name}\nAnalise o documento fornecido para complementar sua resposta.` : ''}

Responda de forma clara, estruturada e sempre baseada nos dados fornecidos.`;

    // ============ BUSCAR HISTÓRICO DA SESSÃO ============
    let conversationHistory: any[] = [];

    if (session_id) {
      const { data: historyData } = await supabase
        .from('salary_assistant_conversations')
        .select('question, answer')
        .eq('session_id', session_id)
        .order('created_at', { ascending: true })
        .limit(8);

      conversationHistory = historyData || [];
    }

    const startTime = Date.now();

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question + (document_text ? `\n\n---DOCUMENTO ANEXADO---\n${document_text}` : '') },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`Erro ao processar com IA: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const answer = aiData.choices[0].message.content;
    const tokensUsed = aiData.usage?.total_tokens || 0;
    const responseTime = Date.now() - startTime;

    // Salvar conversa
    await supabase.from('salary_assistant_conversations').insert({
      user_id: user.id,
      session_id: session_id || null,
      question,
      answer,
      context_data: contextData,
      document_name: document_name || null,
      operation_mode: operationMode,
      tokens_used: tokensUsed,
      response_time_ms: responseTime,
    });

    console.log(`✅ Salary Assistant processed successfully for ${profile.email} (${tokensUsed} tokens, ${responseTime}ms)`);

    return new Response(
      JSON.stringify({
        answer,
        operation_mode: operationMode,
        tokens_used: tokensUsed,
        response_time_ms: responseTime,
        context_summary: {
          has_salary_table: !!activeSalaryTable,
          has_survey_data: !!surveyTables,
          employee_count: contextData.employee_stats?.total_employees || 0,
          knowledge_docs: knowledgeDocs?.length || 0,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Salary Assistant error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao processar consulta',
        details: error.toString() 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
