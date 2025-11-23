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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const { question, document_text, document_name } = await req.json();

    if (!question) {
      throw new Error('Question is required');
    }

    const startTime = Date.now();

    let operationMode = 'consulta';
    let enhancedQuestion = question;

    if (question.toLowerCase().startsWith('/validar_politica')) {
      operationMode = 'validar_politica';
      enhancedQuestion = question.substring('/validar_politica'.length).trim();
    } else if (question.toLowerCase().startsWith('/interpretar_lei')) {
      operationMode = 'interpretar_lei';
      enhancedQuestion = question.substring('/interpretar_lei'.length).trim();
    } else if (question.toLowerCase().startsWith('/compliance_check')) {
      operationMode = 'compliance_check';
      enhancedQuestion = question.substring('/compliance_check'.length).trim();
    }

    // Fetch user's company for context filtering
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('root_company_id')
      .eq('id', user.id)
      .single();

    const userCompanyId = userProfile?.root_company_id;

    // Fetch relevant context from Knowledge Base (RAG) - Global + Company-specific
    const { data: kbDocs } = await supabase
      .from('knowledge_base')
      .select('title, content, category')
      .or(`agent_type.eq.legal,agent_type.eq.both`)
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

    let systemPrompt = `Você é o Agente Smart Legal do CompSmart, especialista em direito trabalhista e previdenciário brasileiro.

## Seu Objetivo
Fornecer consultoria jurídica clara, precisa e acionável sobre questões de RH e legislação trabalhista.

## Contexto do CompSmart
O CompSmart é uma plataforma de gestão de remuneração estratégica para empresas brasileiras de todos os portes.

## 🔒 POLÍTICA DE PRIVACIDADE DE DADOS

⚠️ IMPORTANTE: Proteção de Dados Multi-Tenant
- NUNCA mencione nomes de colaboradores de outras empresas
- NUNCA cite valores salariais específicos de outras empresas
- NUNCA revele estruturas organizacionais de outros clientes
- Use APENAS exemplos genéricos e dados agregados da Knowledge Base Global

${contextFromKB}

## Modo de Operação Atual: ${operationMode}

${operationMode === 'validar_politica' ? `
### MODO: Validação de Política
Você deve analisar políticas e documentos de RH sob a ótica jurídica, verificando:
- Conformidade com CLT e legislação vigente
- Riscos trabalhistas potenciais
- Cláusulas que podem gerar passivos
- Sugestões de adequação legal
` : ''}

${operationMode === 'interpretar_lei' ? `
### MODO: Interpretação de Lei
Você deve explicar artigos e dispositivos legais de forma didática:
- Texto da lei em linguagem simples
- Exemplos práticos de aplicação
- Impactos para a empresa
- Orientações de conformidade
` : ''}

${operationMode === 'compliance_check' ? `
### MODO: Verificação de Compliance
Você deve verificar se práticas e processos estão em conformidade:
- Checklist de conformidade aplicável
- Identificar não-conformidades
- Classificar riscos (baixo, médio, alto)
- Plano de ação para adequação
` : ''}

## Diretrizes de Resposta
1. **Seja específico**: Cite artigos da CLT quando aplicável
2. **Seja prático**: Forneça orientações acionáveis
3. **Seja claro**: Use linguagem acessível sem perder precisão técnica
4. **Seja completo**: Cubra todos os aspectos relevantes da questão
5. **Seja atualizado**: Considere reformas trabalhistas recentes

## Formato de Resposta
- Use markdown para formatação
- Destaque riscos em **negrito**
- Liste referências legais ao final
- Inclua resumo executivo quando pertinente

## Avisos Importantes
- Suas respostas são orientações gerais, não substituem advocacia específica
- Casos complexos devem ser avaliados por advogado especializado
- Sempre oriente sobre riscos e melhores práticas

${document_text ? `\n## DOCUMENTO ANEXADO PARA ANÁLISE\nNome: ${document_name}\n\nConteúdo:\n${document_text.substring(0, 15000)}\n` : ''}`;

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
          { role: 'user', content: enhancedQuestion || question }
        ],
        temperature: 0.7,
        max_tokens: 2000,
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

    const legalReferences: any[] = [];
    const artRegex = /art\.?\s*(\d+)/gi;
    let match;
    while ((match = artRegex.exec(answer)) !== null) {
      legalReferences.push({ type: 'CLT', article: match[1] });
    }

    const responseTime = Date.now() - startTime;

    const { error: insertError } = await supabase
      .from('legal_assistant_conversations')
      .insert({
        user_id: user.id,
        question,
        answer,
        document_text,
        document_name,
        operation_mode: operationMode,
        legal_references: legalReferences.length > 0 ? legalReferences : null,
        tokens_used: tokensUsed,
        response_time_ms: responseTime,
      });

    if (insertError) {
      console.error('Error saving conversation:', insertError);
    }

    return new Response(
      JSON.stringify({
        answer,
        legal_references: legalReferences,
        tokens_used: tokensUsed,
        response_time_ms: responseTime,
        operation_mode: operationMode,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in legal-assistant function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
