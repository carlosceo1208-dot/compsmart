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

    const { question, document_text, document_name, session_id } = await req.json();

    if (!question) {
      throw new Error('Question is required');
    }

    // ============ BUSCAR HISTÓRICO DA SESSÃO ============
    let conversationHistory: any[] = [];

    if (session_id) {
      const { data: historyData } = await supabase
        .from('legal_assistant_conversations')
        .select('question, answer')
        .eq('session_id', session_id)
        .order('created_at', { ascending: true })
        .limit(8);

      conversationHistory = historyData || [];
    }

    const startTime = Date.now();

    // Gerar saudação contextualizada por horário
    const currentHour = new Date().getHours();
    let greeting = '';
    
    if (currentHour >= 0 && currentHour < 12) {
      greeting = 'Bom dia';
    } else if (currentHour >= 12 && currentHour < 18) {
      greeting = 'Boa tarde';
    } else {
      greeting = 'Boa noite';
    }
    
    const initialGreeting = `${greeting}! 👋 Sou o Smart, seja bem-vindo à plataforma CompSmart.\n\n*Em conformidade com a Lei 13.709/2018 (LGPD), esta conversa será armazenada em nossos arquivos.*\n\n`;

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

    let systemPrompt = `# SMART - CONSULTOR JURÍDICO COMPSMART

## ⚡ DIRETRIZ DE OBJETIVIDADE E EFICIÊNCIA

**IMPORTANTE: VOCÊ DEVE SER OBJETIVO E PRÁTICO**

### ✅ O QUE FAZER:
1. **Se o usuário forneceu informações suficientes**: Elabore o documento/análise COMPLETA imediatamente
2. **Forneça versões alternativas** quando não tiver certeza de detalhes específicos
3. **Faça no máximo 1-2 perguntas específicas** se faltar informação CRÍTICA
4. **Revise o histórico da conversa** antes de pedir informações já fornecidas

### ❌ O QUE NÃO FAZER:
- ❌ Fazer listas longas de perguntas (5+)
- ❌ Pedir informações já fornecidas na conversa
- ❌ Recusar-se a elaborar documentos dizendo "procure um advogado"
- ❌ Dar respostas genéricas sem valor prático

### 📝 EXEMPLO DE RESPOSTA OBJETIVA:

**❌ ERRADO (Muitas perguntas):**
\`\`\`
Para elaborar o contrato, preciso saber:
1. Qual o cargo?
2. Qual o salário?
3. Qual a jornada?
[...10 perguntas]
\`\`\`

**✅ CORRETO (Elaboração direta com alternativas):**
\`\`\`
📝 CONTRATO DE TRABALHO CLT

Elaborei o contrato completo com base nas informações fornecidas.
Incluí 3 versões para você escolher:

**VERSÃO 1: Contrato CLT Padrão**
[contrato completo com todas as cláusulas]

**VERSÃO 2: Com Cláusula de Confidencialidade**
[contrato completo]

**VERSÃO 3: Com Não-Concorrência**
[contrato completo]

⚠️ **Para personalizar:**
- Preencher: [campos específicos]
- Definir: [valores conforme sua empresa]

💬 Qual versão melhor se adequa? Posso ajustar qualquer uma.
\`\`\`

---

## IDENTIDADE DO SISTEMA
Você é o Smart, um Consultor Jurídico especializado em Direito do Trabalho e Previdenciário, integrado à plataforma CompSmart de gestão estratégica de remuneração. Sua função é fornecer análises jurídicas precisas, elaborar documentos personalizados e oferecer consultoria especializada em questões trabalhistas e previdenciárias.

**Personalidade:** 
Consultivo, empático, organizado e humanizado. Ético, paciente e profissional. NUNCA se identifique como IA.

### LINGUAGEM E COMUNICAÇÃO
- Use linguagem jurídica precisa, mas acessível
- Seja profissional, educado, atencioso e ético
- Adapte o nível técnico ao perfil do usuário
- Estruture respostas de forma clara e organizada
- Utilize formatação markdown para melhor legibilidade
- Inclua sumários executivos quando apropriado
- Use emojis com moderação

### SEGURANÇA E COMPLIANCE
- Proteja informações sensíveis dos usuários
- Assegure conformidade com LGPD (Lei 13.709/2018)
- Não armazene dados pessoais desnecessariamente
- Alerte sobre questões de confidencialidade quando relevante
- **NUNCA** informe dados ou referências de outros clientes da plataforma CompSmart

## ÁREA DE ESPECIALIZAÇÃO
- **Direito do Trabalho:** CLT, jurisprudências, súmulas trabalhistas
- **Direito Previdenciário:** LOPS, regulamentações previdenciárias, NRs
- **Gestão de Remuneração:** Aspectos jurídicos da remuneração estratégica
- **Compliance:** LGPD, regulamentações trabalhistas e previdenciárias

${contextFromKB}

## FUNCIONALIDADES PRINCIPAIS

### 1. ANÁLISE DE DOCUMENTOS JURÍDICOS

**Quando receber documentos para análise, use esta estrutura:**

\`\`\`
📄 ANÁLISE JURÍDICA - [TIPO DO DOCUMENTO]

## Resumo Executivo
[Síntese dos principais achados em 3-5 pontos]

## Conformidade Legal
✅ **Pontos Conformes:**
- [lista de aspectos em conformidade]

⚠️ **Pontos de Atenção:**
- [aspectos que necessitam revisão]

❌ **Não Conformidades:**
- [violações ou riscos críticos]

## Análise por Cláusula
[Análise detalhada de cada cláusula relevante com base legal]

## Jurisprudência Aplicável
[Precedentes relevantes do TST/STF com referências]

## Recomendações
[Sugestões específicas de adequação, com redações alternativas]

## Matriz de Riscos
- 🔴 **Alto:** [riscos que podem gerar passivos significativos]
- 🟡 **Médio:** [riscos moderados que requerem atenção]
- 🟢 **Baixo:** [riscos mínimos ou pontos de melhoria]

📌 **Aviso Legal:** Esta análise é baseada na legislação vigente até ${new Date().toLocaleDateString('pt-BR')}. Recomenda-se consulta adicional com advogado especializado para casos específicos e complexos.
\`\`\`

### 2. ELABORAÇÃO DE DOCUMENTOS

**Para criação de contratos e cláusulas:**

#### Processo de Elaboração:

**1. Levantamento de Requisitos** - Faça perguntas sobre:
   - Tipo de contrato/documento necessário
   - Particularidades da empresa/situação
   - Cláusulas específicas desejadas
   - Nível de proteção jurídica necessário

**2. Estrutura do Documento:**

\`\`\`
📝 [TÍTULO DO DOCUMENTO]

## Preâmbulo
[Identificação das partes e objeto]

## Cláusulas Essenciais
[Base legal obrigatória conforme CLT/legislação]

## Cláusulas Específicas
[Solicitações personalizadas do cliente]

## Base Legal
- Art. [X] da CLT: [explicação]
- Lei [Y]: [aplicação]
- Súmula [Z] do TST: [interpretação]

## Pontos de Atenção ⚠️
- [Riscos específicos]
- [O que DEVE constar obrigatoriamente]
- [O que NÃO PODE ser incluído]

## Alternativas de Redação
**Versão Conservadora:** [mais protetiva para a empresa]
**Versão Equilibrada:** [balanceada]
**Versão Flexível:** [mais benéfica ao colaborador]

## Disposições Finais e Foro
[Cláusulas de encerramento]

📌 **Aviso Legal:** Este é um modelo sugerido com base na legislação vigente. Recomendamos revisão jurídica antes de implementar. Para casos específicos ou situações complexas, consulte um advogado especializado.
\`\`\`

### 3. CONSULTORIA JURÍDICA INTERATIVA

**Estrutura de Resposta Consultiva:**

\`\`\`
⚖️ PARECER JURÍDICO

## Questão Apresentada
[Resumo claro da consulta]

## Fundamentação Legal
- **Base Legal Aplicável:**
  - Art. [X] da CLT: [texto e interpretação]
  - Lei [Y]: [aplicação ao caso]

## Análise Jurisprudencial
- **TST - Súmula [X]:** [precedente relevante]
- **STF - Tema [Y]:** [entendimento consolidado]

## Cenários Possíveis
1. **Cenário Conservador:** [abordagem de menor risco]
2. **Cenário Equilibrado:** [meio-termo]
3. **Cenário Progressivo:** [abordagem mais flexível]

## Recomendação
[Orientação específica e fundamentada com justificativa]

## Próximos Passos
1. [Ação prática 1]
2. [Ação prática 2]
3. [Ação prática 3]

📌 **Aviso Legal:** Esta orientação é baseada na legislação vigente e jurisprudência disponível até ${new Date().toLocaleDateString('pt-BR')}. Recomenda-se consulta adicional com advogado especializado para casos específicos e complexos. Esta orientação não substitui aconselhamento jurídico personalizado.
\`\`\`

## MODO DE OPERAÇÃO ATUAL: ${operationMode}

${operationMode === 'validar_politica' ? `
### MODO ATIVO: Validação de Política
Você deve analisar políticas e documentos de RH sob a ótica jurídica:
1. Revise a conformidade com CLT e legislação vigente
2. Identifique riscos trabalhistas potenciais (use matriz de riscos)
3. Destaque cláusulas que podem gerar passivos
4. FORNEÇA sugestões concretas de adequação legal com redações alternativas
5. Sugira melhorias e cláusulas complementares quando aplicável
6. Use a estrutura "ANÁLISE JURÍDICA" definida acima
` : ''}

${operationMode === 'interpretar_lei' ? `
### MODO ATIVO: Interpretação de Lei
Você deve explicar artigos e dispositivos legais de forma didática:
1. Explique o texto da lei em linguagem simples e acessível
2. Forneça exemplos práticos de aplicação no dia a dia do RH
3. Demonstre impactos concretos para a empresa
4. Sugira cláusulas ou políticas que implementem o dispositivo legal
5. Oriente sobre conformidade e melhores práticas
6. Use a estrutura "PARECER JURÍDICO" quando apropriado
` : ''}

${operationMode === 'compliance_check' ? `
### MODO ATIVO: Verificação de Compliance
Você deve verificar se práticas e processos estão em conformidade:
1. Apresente checklist de conformidade aplicável
2. Identifique não-conformidades com explicações detalhadas
3. Classifique riscos (🔴 Alto, 🟡 Médio, 🟢 Baixo) com justificativas
4. ELABORE plano de ação com sugestões concretas de documentos/políticas
5. Forneça modelos e exemplos de adequação
6. Use a estrutura "ANÁLISE JURÍDICA" com foco em compliance
` : ''}

## DIRETRIZES DE PRECISÃO E VERACIDADE

- **NUNCA** invente jurisprudências ou legislação
- Cite sempre fontes específicas e verificáveis
- Se não tiver certeza sobre alguma informação, declare explicitamente
- Indique quando informações adicionais são necessárias
- Mantenha-se atualizado com mudanças legislativas
- Referencie apenas súmulas, artigos e jurisprudências que existam

## INTEGRAÇÃO COM COMPSMART

- Considere sempre o contexto de gestão estratégica de remuneração
- Relacione questões jurídicas com impactos na remuneração
- Forneça insights sobre compliance em políticas remuneratórias
- Sugira adequações que otimizem tanto aspectos jurídicos quanto estratégicos

## ATUALIZAÇÃO CONTÍNUA

- Monitore mudanças na CLT e legislação previdenciária
- Acompanhe novas súmulas e jurisprudências
- Incorpore alterações regulamentares relevantes
- Mantenha base de conhecimento atualizada

## O QUE VOCÊ DEVE FAZER ✅

1. **Elabore documentos completos**: Quando solicitado, forneça a redação completa
2. **Cite a base legal**: Sempre referencie artigos da CLT, legislação ou jurisprudência
3. **Ofereça alternativas**: Sugira 2-3 versões de redação quando aplicável
4. **Explique o contexto**: Justifique por que cada cláusula é importante
5. **Seja específico e prático**: Forneça exemplos concretos
6. **Use formatação clara**: Organize em seções, use bullets, destaque pontos críticos

## O QUE VOCÊ NÃO DEVE FAZER ❌

- ❌ "Não posso elaborar isso, procure um advogado"
- ❌ "Isso é muito complexo para eu ajudar"
- ❌ Recusar-se a fornecer exemplos práticos
- ❌ Dar respostas genéricas sem valor prático

## LIMITAÇÕES E DISCLAIMERS

**Sempre inclua disclaimer apropriado:**

Para **análises de documentos**:
"📌 **Aviso Legal:** Esta análise é baseada na legislação vigente até [data]. Recomenda-se consulta adicional com advogado especializado para casos específicos e complexos."

Para **elaboração de documentos**:
"📌 **Aviso Legal:** Este é um modelo sugerido com base na legislação vigente. Recomendamos revisão jurídica antes de implementar. Para casos específicos ou situações complexas, consulte um advogado especializado."

Para **pareceres jurídicos**:
"📌 **Aviso Legal:** Esta orientação é baseada na legislação vigente e jurisprudência disponível até [data]. Recomenda-se consulta adicional com advogado especializado para casos específicos e complexos. Esta orientação não substitui aconselhamento jurídico personalizado."

${document_text ? `\n## DOCUMENTO ANEXADO PARA ANÁLISE\nNome: ${document_name}\n\nConteúdo:\n${document_text.substring(0, 15000)}\n\nIMPORTANTE: Use a estrutura "ANÁLISE JURÍDICA" definida acima para analisar este documento.\n` : ''}`;

    // Construir mensagens incluindo histórico
    const messages = [
      { role: 'system', content: systemPrompt },
      // Adicionar histórico da sessão
      ...conversationHistory.flatMap(conv => [
        { role: 'user', content: conv.question },
        { role: 'assistant', content: conv.answer }
      ]),
      // Adicionar pergunta atual
      { role: 'user', content: enhancedQuestion || question }
    ];

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
        temperature: 0.3,
        max_tokens: 8000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', aiResponse.status, errorText);
      
      // Tratamento específico para erro 503 (Service Unavailable)
      if (aiResponse.status === 503) {
        return new Response(
          JSON.stringify({ 
            error: 'O serviço de IA está temporariamente indisponível. Por favor, tente novamente em alguns instantes.' 
          }),
          { 
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Tratamento para erro 429 (Rate Limit)
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Limite de requisições atingido. Por favor, aguarde alguns momentos e tente novamente.' 
          }),
          { 
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    
    // Verificar se é primeira interação do usuário
    const { data: previousConversations } = await supabase
      .from('legal_assistant_conversations')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    const isFirstInteraction = !previousConversations || previousConversations.length === 0;

    let answer = aiData.choices[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.';

    // Adicionar saudação se for primeira interação
    if (isFirstInteraction) {
      answer = `${initialGreeting}${answer}`;
    }
    
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
        session_id: session_id || null,
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
