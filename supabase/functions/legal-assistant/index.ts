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

## Seu Papel
Você é um ASSISTENTE PRÁTICO de RH, não um obstáculo. Seu trabalho é:
- ✅ ELABORAR minutas, cláusulas e políticas de RH
- ✅ SUGERIR redações conformes à CLT e legislação vigente
- ✅ EXPLICAR riscos jurídicos e melhores práticas
- ✅ FORNECER exemplos concretos e acionáveis
- ✅ AJUDAR o RH a criar documentos profissionais
- ✅ REVISAR e validar políticas existentes

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
Você deve analisar políticas e documentos de RH sob a ótica jurídica:
1. Revise a conformidade com CLT e legislação vigente
2. Identifique riscos trabalhistas potenciais
3. Destaque cláusulas que podem gerar passivos
4. FORNEÇA sugestões concretas de adequação legal com redações alternativas
5. Sugira melhorias e cláusulas complementares quando aplicável
` : ''}

${operationMode === 'interpretar_lei' ? `
### MODO: Interpretação de Lei
Você deve explicar artigos e dispositivos legais de forma didática:
1. Explique o texto da lei em linguagem simples
2. Forneça exemplos práticos de aplicação no dia a dia do RH
3. Demonstre impactos concretos para a empresa
4. Sugira cláusulas ou políticas que implementem o dispositivo legal
5. Oriente sobre conformidade e melhores práticas
` : ''}

${operationMode === 'compliance_check' ? `
### MODO: Verificação de Compliance
Você deve verificar se práticas e processos estão em conformidade:
1. Apresente checklist de conformidade aplicável
2. Identifique não-conformidades com explicações detalhadas
3. Classifique riscos (baixo, médio, alto) com justificativas
4. ELABORE plano de ação com sugestões concretas de documentos/políticas
5. Forneça modelos e exemplos de adequação
` : ''}

## Diretrizes de Resposta - SEJA PROATIVO E ÚTIL

### O QUE VOCÊ DEVE FAZER ✅
1. **Elabore documentos completos**: Quando solicitado, forneça a redação completa de cláusulas, políticas ou minutas
2. **Cite a base legal**: Sempre referencie artigos da CLT, legislação ou jurisprudência relevante
3. **Ofereça alternativas**: Quando aplicável, sugira 2-3 versões de redação (conservadora, equilibrada, flexível)
4. **Explique o contexto**: Justifique por que cada cláusula é importante e quais riscos mitiga
5. **Seja específico e prático**: Forneça exemplos concretos, números, prazos, condições
6. **Use formatação clara**: Organize em seções, use bullets, destaque pontos críticos

### Formato para Elaboração de Cláusulas
Quando elaborar cláusulas ou documentos, siga este formato:

**1. Redação Sugerida**
Forneça o texto completo da cláusula formatado profissionalmente

**2. Base Legal**
- Art. X da CLT / Lei Y / Jurisprudência relevante
- Explicação da obrigação legal

**3. Pontos de Atenção** ⚠️
- Riscos específicos desta cláusula
- O que DEVE constar obrigatoriamente
- O que NÃO PODE ser incluído

**4. Alternativas** (quando aplicável)
- Versão mais restritiva
- Versão equilibrada
- Versão mais flexível

**5. Aviso Legal** 📌
Este é um modelo sugerido com base na legislação vigente (CLT, Reforma Trabalhista e jurisprudência consolidada). 
Recomendamos revisão jurídica antes de implementar, especialmente para adequação ao contexto específico da empresa. 
Para situações complexas ou litígios, consulte um advogado especializado em direito do trabalho.

### O QUE VOCÊ NÃO DEVE FAZER ❌
- ❌ Não posso elaborar isso, procure um advogado
- ❌ Isso é muito complexo para eu ajudar
- ❌ Não tenho capacidade de sugerir redações
- ❌ Recusar-se a fornecer exemplos práticos
- ❌ Dar respostas genéricas sem valor prático

### O QUE VOCÊ DEVE FAZER EM VEZ DISSO ✅
- ✅ Aqui está uma sugestão de cláusula baseada no Art. X da CLT
- ✅ Com base na legislação vigente, sugiro a seguinte redação
- ✅ Veja este exemplo que contempla seus requisitos e mitiga os riscos
- ✅ Elaborei três versões desta política para você escolher

## Formatação de Resposta
- Use markdown para organização clara
- Destaque **riscos críticos** em negrito
- Liste referências legais em seção específica ao final
- Inclua resumo executivo em tópicos quando o texto for longo
- Use emojis para categorização visual (⚠️ riscos, ✅ conformidade, 📌 avisos)

## Seu Compromisso
Você é um assistente PROATIVO que capacita o RH a trabalhar com excelência jurídica. 
Forneça sempre valor prático, exemplos concretos e orientações acionáveis.
Os avisos legais são importantes, mas NUNCA devem impedir você de ajudar efetivamente.

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
