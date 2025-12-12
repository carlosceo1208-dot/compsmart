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

    // Buscar dados COMPLETOS dos funcionários para análise de equidade
    const { data: employeeData } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        grade,
        salary,
        variable_salary,
        salary_range_percentage,
        job_title,
        job_title_id,
        unit_id
      `)
      .eq('root_company_id', profile.root_company_id)
      .eq('status', 'active')
      .not('salary', 'is', null);

    // Buscar nomes de unidades
    const { data: units } = await supabase
      .from('organizational_structure')
      .select('id, description, name')
      .eq('root_company_id', profile.root_company_id);

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

    // Mapear dados de unidades para lookup rápido
    const unitMap = units?.reduce((acc: any, u: any) => {
      acc[u.id] = u.description || u.name;
      return acc;
    }, {}) || {};

    // Criar faixas salariais por grade para lookup
    const salaryRangesByGrade = activeSalaryTable?.salary_ranges?.reduce((acc: any, sr: any) => {
      const normalizedGrade = sr.grade.toString().padStart(3, '0');
      acc[normalizedGrade] = {
        min: sr.min_value,
        q1: sr.q1_value,
        median: sr.median_value,
        q3: sr.q3_value,
        max: sr.max_value
      };
      return acc;
    }, {}) || {};

    // Preparar dados detalhados de funcionários para a IA
    const employeeDetails = employeeData?.map((emp: any, idx: number) => {
      const normalizedGrade = emp.grade?.toString().padStart(3, '0') || '';
      const gradeRange = salaryRangesByGrade[normalizedGrade];
      const compaRatio = gradeRange?.median ? Math.round((emp.salary / gradeRange.median) * 100) : null;
      
      return {
        id: `FUNC_${String(idx + 1).padStart(3, '0')}`,
        nome: emp.full_name,
        cargo: emp.job_title || 'N/A',
        grade: emp.grade,
        salario_base: emp.salary,
        salario_variavel: emp.variable_salary || 0,
        percentual_faixa: emp.salary_range_percentage,
        compa_ratio: compaRatio,
        unidade: unitMap[emp.unit_id] || 'N/A',
        faixa_grade: gradeRange || null,
      };
    }) || [];

    // Construir contexto
    const contextData = {
      salary_table: activeSalaryTable,
      salary_ranges_by_grade: salaryRangesByGrade,
      job_titles: jobTitles,
      survey_data: surveyTables,
      employee_details: employeeDetails,
      employee_stats: employeeData ? {
        total_employees: employeeData.length,
        grades_distribution: employeeData.reduce((acc: any, emp: any) => {
          acc[emp.grade] = (acc[emp.grade] || 0) + 1;
          return acc;
        }, {}),
        salary_ranges: {
          min: Math.min(...employeeData.map((e: any) => e.salary)),
          max: Math.max(...employeeData.map((e: any) => e.salary)),
          avg: employeeData.reduce((sum: number, e: any) => sum + e.salary, 0) / employeeData.length,
        }
      } : null,
      knowledge_base: knowledgeDocs?.map(doc => ({
        title: doc.title,
        category: doc.category,
        content: doc.content.substring(0, 1000),
      })),
    };

    // Formatar dados dos funcionários para o prompt
    const employeeDataForPrompt = employeeDetails.map((emp: any) => {
      const posicionamento = emp.compa_ratio 
        ? emp.compa_ratio < 80 ? 'Abaixo do Mercado' 
          : emp.compa_ratio < 90 ? 'Competitivo Inferior'
          : emp.compa_ratio <= 110 ? 'Alinhado ao Mercado'
          : emp.compa_ratio <= 120 ? 'Competitivo Superior'
          : 'Acima do Mercado'
        : 'N/A';
      
      return `| ${emp.nome} | ${emp.cargo} | ${emp.grade} | R$ ${emp.salario_base.toLocaleString('pt-BR')} | ${emp.compa_ratio || 'N/A'}% | ${posicionamento} | ${emp.unidade} |`;
    }).join('\n');

    // Formatar faixas salariais por grade
    const gradeRangesForPrompt = Object.entries(salaryRangesByGrade).map(([grade, range]: [string, any]) => {
      return `| ${grade} | R$ ${range.min.toLocaleString('pt-BR')} | R$ ${range.q1.toLocaleString('pt-BR')} | R$ ${range.median.toLocaleString('pt-BR')} | R$ ${range.q3.toLocaleString('pt-BR')} | R$ ${range.max.toLocaleString('pt-BR')} |`;
    }).join('\n');

    // System prompt otimizado para análise salarial com dados reais
    const systemPrompt = `Você é o **Agente Smart de Análise Salarial**, especialista em estrutura de cargos, faixas salariais e benchmarking de mercado.

**📊 CONTEXTO DA EMPRESA:**
- Tabela Salarial Ativa: ${activeSalaryTable ? `${activeSalaryTable.name} (${activeSalaryTable.effective_month}/${activeSalaryTable.effective_year})` : 'Não configurada'}
- Total de Funcionários: ${contextData.employee_stats?.total_employees || 0}
- Grades em Uso: ${Object.keys(contextData.employee_stats?.grades_distribution || {}).join(', ')}

**💰 FAIXAS SALARIAIS POR GRADE (TABELA ATIVA):**
| Grade | Mínimo | Q1 | Mediana (P50) | Q3 | Máximo |
|-------|--------|----|--------------:|----:|-------:|
${gradeRangesForPrompt || 'Nenhuma faixa configurada'}

**👥 DADOS COMPLETOS DOS FUNCIONÁRIOS:**
| Nome | Cargo | Grade | Salário Base | Compa-Ratio | Posicionamento | Unidade |
|------|-------|-------|-------------:|------------:|----------------|---------|
${employeeDataForPrompt || 'Nenhum funcionário cadastrado'}

**🎯 MODO DE OPERAÇÃO ATUAL: ${operationMode.toUpperCase()}**

**🔧 INSTRUÇÕES ESSENCIAIS:**

1. **Cálculo de Compa-Ratio:**
   - Compa-Ratio = (Salário Real / P50 da Faixa) × 100
   - < 80%: Abaixo do mercado
   - 80-90%: Competitivo inferior
   - 90-110%: Alinhado ao mercado
   - 110-120%: Competitivo superior
   - > 120%: Acima do mercado

2. **Análise de Equidade Interna:**
   - Verificar compressão salarial (subordinado ganha mais que gestor)
   - Identificar distorções dentro da mesma grade
   - Calcular dispersão salarial por área/departamento

3. **Benchmarking de Mercado:**
   - Comparar P50 interno vs P50 de pesquisas
   - Calcular gap percentual
   - Avaliar competitividade por cargo/área

**📋 QUANDO RECOMENDAR AJUSTES:**
- Funcionários abaixo de 80% do P50 (prioridade alta)
- Inversões hierárquicas (urgente)
- Distorções dentro da mesma grade > 30%

**⚠️ IMPORTANTE:**
- USE OS DADOS REAIS ACIMA para fazer análises
- NÃO peça dados ao usuário - você já tem acesso completo
- Calcule compa-ratio baseado nos dados fornecidos
- Identifique distorções e sugira ajustes específicos

${operationMode === 'analise_equidade' ? `
**🎯 FOCO ATUAL: ANÁLISE DE EQUIDADE INTERNA**
USE OS DADOS ACIMA PARA:
- Listar funcionários fora da faixa ideal (<80% ou >120%)
- Calcular compa-ratio de cada funcionário
- Identificar distorções por grade (dispersão >30%)
- Detectar inversões hierárquicas
- Sugerir ajustes priorizados por urgência com valores específicos
` : ''}

${operationMode === 'benchmark_mercado' ? `
**🎯 FOCO ATUAL: BENCHMARKING DE MERCADO**
USE OS DADOS ACIMA PARA:
- Compare P50 interno vs pesquisas salariais (se disponíveis)
- Calcule gap percentual por cargo/grade
- Identifique cargos críticos
- Recomende ajustes baseados em competitividade
` : ''}

${operationMode === 'recomendacao_ajuste' ? `
**🎯 FOCO ATUAL: RECOMENDAÇÃO DE AJUSTES**
USE OS DADOS ACIMA PARA:
- Priorize casos mais críticos (equidade > mercado)
- Sugira percentuais de aumento específicos para cada funcionário
- Calcule impacto orçamentário mensal e anual
- Forneça roadmap de implementação
` : ''}

${document_text ? `\n**📄 DOCUMENTO ANEXADO: ${document_name}\nAnalise o documento fornecido para complementar sua resposta.` : ''}

Responda de forma clara, estruturada e baseada nos dados REAIS fornecidos acima. NÃO solicite informações adicionais.`;

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
        max_tokens: 8000,
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
