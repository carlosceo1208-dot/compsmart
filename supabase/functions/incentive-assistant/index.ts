import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!supabaseUrl || !supabaseKey || !lovableApiKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const { question, document_text, document_name, session_id } = await req.json();

    if (!question) {
      throw new Error('Question is required');
    }

    // ============ BUSCAR HISTÓRICO DA SESSÃO ============
    let conversationHistory: any[] = [];

    if (session_id) {
      const { data: historyData } = await supabase
        .from('incentive_assistant_conversations')
        .select('question, answer')
        .eq('session_id', session_id)
        .order('created_at', { ascending: true })
        .limit(8);

      conversationHistory = historyData || [];
    }

    const startTime = Date.now();

    // Detect special operation mode
    let operationMode = 'consulta';
    let enhancedQuestion = question;

    if (question.toLowerCase().startsWith('/gerar_politica')) {
      operationMode = 'gerar_politica';
      enhancedQuestion = question.substring('/gerar_politica'.length).trim();
    } else if (question.toLowerCase().startsWith('/comparar_mercado')) {
      operationMode = 'comparar_mercado';
      enhancedQuestion = question.substring('/comparar_mercado'.length).trim();
    } else if (question.toLowerCase().startsWith('/mix_total_rewards')) {
      operationMode = 'mix_total_rewards';
      enhancedQuestion = question.substring('/mix_total_rewards'.length).trim();
    }

    // Fetch user profile with company context (single query to avoid duplication)
    const { data: profile } = await supabase
      .from('profiles')
      .select('grade, salary, unit_id, job_title_id, root_company_id')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.root_company_id) {
      throw new Error('User profile or company not found');
    }

    const userCompanyId = profile.root_company_id;

    // Fetch relevant context from Knowledge Base (RAG) - Global + Company-specific
    const { data: kbDocs } = await supabase
      .from('knowledge_base')
      .select('title, content, category')
      .or(`agent_type.eq.incentive,agent_type.eq.both`)
      .eq('is_active', true)
      .or(`is_global.eq.true${userCompanyId ? `,root_company_id.eq.${userCompanyId}` : ''}`)
      .limit(10);

    let contextFromKB = '';
    if (kbDocs && kbDocs.length > 0) {
      contextFromKB = '\n\n## Base de Conhecimento Relevante:\n\n';
      kbDocs.forEach(doc => {
        contextFromKB += `### ${doc.title} (${doc.category})\n${doc.content}\n\n`;
      });
    }

    // Fetch company context data (with root_company_id for isolation)
    const { data: activeSalaryTable } = await supabase
      .from('salary_tables')
      .select('id, name')
      .eq('root_company_id', userCompanyId)
      .eq('is_active', true)
      .maybeSingle();

    const { data: activePrograms } = await supabase
      .from('incentive_programs')
      .select('name, program_type, target_percentage')
      .eq('root_company_id', userCompanyId)
      .eq('is_active', true);

    let companyContext = '\n\n## Contexto da Empresa:\n';
    if (activeSalaryTable) {
      companyContext += `- Tabela Salarial Ativa: ${activeSalaryTable.name}\n`;
    }
    if (activePrograms && activePrograms.length > 0) {
      companyContext += `- Programas de Incentivos Ativos: ${activePrograms.map(p => p.name).join(', ')}\n`;
    }
    if (profile?.grade) {
      companyContext += `- Grade do usuário: ${profile.grade}\n`;
    }

    // Build system prompt with privacy policy
    let systemPrompt = `Você é o Agente Smart de Remuneração & Benefícios do CompSmart, especialista em compensação estratégica, estruturas salariais e programas de incentivos.

## Seu Objetivo
Fornecer consultoria especializada em remuneração, benefícios e incentivos para empresas brasileiras, combinando metodologias internacionais (Hay, Mercer) com práticas locais.

## Contexto do CompSmart
O CompSmart é uma plataforma de gestão de remuneração estratégica que ajuda empresas a:
- Estruturar tabelas salariais competitivas
- Desenhar programas de PLR, ICP e ILP
- Gerenciar benefícios e elegibilidades
- Analisar posicionamento de mercado

## 🔒 POLÍTICA DE PRIVACIDADE DE DADOS - MULTI-TENANT

VOCÊ ESTÁ OPERANDO EM MODO MULTI-TENANT SEGURO:

✅ PERMITIDO:
- Usar conhecimento geral da Knowledge Base Global
- Sugerir práticas de mercado genéricas
- Recomendar metodologias (Hay, Mercer, etc)
- Fornecer exemplos hipotéticos
- Usar dados da empresa atual (root_company_id: ${userCompanyId})

❌ PROIBIDO (VIOLAÇÃO GRAVE):
- Mencionar nomes de colaboradores de outras empresas
- Citar salários específicos de outros clientes
- Revelar estruturas organizacionais de outras empresas
- Usar dados reais de outras empresas como referência

**REGRA DE OURO:** Se o dado não está na Knowledge Base Global 
ou não pertence à empresa atual, NUNCA use!

${contextFromKB}

${companyContext}

## Modo de Operação Atual: ${operationMode}

${operationMode === 'gerar_politica' ? `
### MODO: Geração de Política
Você deve criar políticas de remuneração e benefícios completas:
- Objetivos e princípios da política
- Critérios de elegibilidade claros
- Fórmulas de cálculo (quando aplicável)
- Governança e periodicidade
- Comunicação e transparência
` : ''}

${operationMode === 'comparar_mercado' ? `
### MODO: Comparação com Mercado
Você deve analisar o posicionamento competitivo:
- Benchmarks de mercado (quando disponíveis)
- Análise de competitividade salarial
- Comparação de benefícios
- Recomendações de ajustes
- Estratégia de atração e retenção
` : ''}

${operationMode === 'mix_total_rewards' ? `
### MODO: Mix de Remuneração Total
Você deve analisar e otimizar o pacote de remuneração:
- Proporção Fixo vs. Variável
- Composição de benefícios
- Incentivos de curto e longo prazo
- Competitividade total do pacote
- Sugestões de otimização
` : ''}

## Metodologias de Referência
- **Hay**: Pontos fatoriais (Know-How, Problem Solving, Accountability)
- **Mercer**: Grades salariais e amplitude de faixas
- **PLR**: Lei 10.101/2000 - Participação nos Lucros e Resultados
- **ICP/ILP**: Incentivos de Curto e Longo Prazo

## Diretrizes de Resposta
1. **Seja estratégico**: Conecte remuneração aos objetivos de negócio
2. **Seja prático**: Forneça modelos, templates e fórmulas prontas
3. **Seja competitivo**: Considere práticas de mercado
4. **Seja completo**: Cubra aspectos financeiros, legais e culturais
5. **Seja orientado a dados**: Use números, percentuais e exemplos concretos

## Formato de Resposta
- Use markdown para formatação
- Inclua tabelas quando pertinente
- Forneça fórmulas e cálculos claros
- Liste referências e melhores práticas
- Inclua resumo executivo para decisão

## Avisos Importantes
- Suas recomendações devem considerar a realidade e capacidade da empresa
- Incentivos devem estar alinhados à cultura organizacional
- Mudanças em remuneração requerem comunicação clara
- Considere impactos em folha de pagamento e encargos

${document_text ? `\n## DOCUMENTO ANEXADO PARA ANÁLISE\nNome: ${document_name}\n\nConteúdo:\n${document_text.substring(0, 15000)}\n` : ''}`;

    // Call Lovable AI with Pro model for complex reasoning
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: enhancedQuestion || question }
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const answer = aiData.choices[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.';
    const tokensUsed = aiData.usage?.total_tokens || 0;

    const responseTime = Date.now() - startTime;

    // Build context data for storage
    const contextData = {
      active_salary_table: activeSalaryTable?.name,
      active_programs: activePrograms?.map(p => p.name),
      user_grade: profile?.grade,
    };

    // Save conversation to database
    const { error: insertError } = await supabase
      .from('incentive_assistant_conversations')
      .insert({
        user_id: user.id,
        session_id: session_id || null,
        question,
        answer,
        document_text,
        document_name,
        operation_mode: operationMode,
        context_data: contextData,
        tokens_used: tokensUsed,
        response_time_ms: responseTime,
      });

    if (insertError) {
      console.error('Error saving conversation:', insertError);
    }

    return new Response(
      JSON.stringify({
        answer,
        context_data: contextData,
        tokens_used: tokensUsed,
        response_time_ms: responseTime,
        operation_mode: operationMode,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in incentive-assistant function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});