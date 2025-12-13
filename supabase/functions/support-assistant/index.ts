import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY não está configurada');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { question, pageContext } = await req.json();

    if (!question) {
      return new Response(
        JSON.stringify({ error: 'Question is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Support Assistant] Processing question:', question);
    console.log('[Support Assistant] Page context:', pageContext);

    const startTime = Date.now();

    // System prompt especializado
    const systemPrompt = `# COMPSMART HELPER - ASSISTENTE DE SUPORTE INTELIGENTE

## IDENTIDADE
Você é o CompSmart Helper, o assistente de suporte oficial da plataforma CompSmart de gestão estratégica de remuneração. 

**Personalidade:** 
Prestativo, paciente, didático e objetivo. Você existe para ajudar usuários a resolver problemas técnicos, entender funcionalidades e aproveitar ao máximo o CompSmart.

## CONHECIMENTO DO COMPSMART

### MÓDULOS PRINCIPAIS

**🟩 CORE - Gestão de Remuneração**
- Cadastro de colaboradores e estrutura organizacional
- Tabelas salariais com faixas e grades
- Cálculo de curvas salariais automáticas
- Gestão de benefícios e incentivos
- Avaliação de desempenho e PDI
- Orçamento e planejamento de headcount

**🟦 INSIGHT - Inteligência Salarial**
- Comparação com mercado (benchmarking)
- IA preditiva para ajustes salariais
- Dashboard de competitividade
- Análise de tendências e defasagens

**🟨 MATCH - Descrição de Cargos**
- Job matching inteligente com IA
- Descrições de cargos padronizadas
- Compatibilidade com metodologias Hay/Mercer
- Mapeamento de competências

### FUNCIONALIDADES POR PÁGINA

${pageContext ? `
**CONTEXTO ATUAL: ${pageContext}**

${pageContext.includes('dashboard') ? `
📊 **Dashboard:**
- Indicadores econômicos (INPC, Dólar) em tempo real
- KPIs de remuneração (custo total, média salarial)
- Navegação alfabética para módulos
- Exportação de dados
` : ''}

${pageContext.includes('employees') ? `
👥 **Colaboradores:**
- Cadastro completo com foto e dados pessoais
- Importação em lote via Excel
- Cálculo automático de percentual na faixa salarial
- Vinculação com cargo, grade e unidade organizacional
- Gestão de benefícios por colaborador
` : ''}

${pageContext.includes('salary-ranges') ? `
💰 **Tabelas Salariais:**
- Criação de tabelas por vigência (mês/ano)
- Faixas salariais por Grade (A, B, C, etc.)
- Cálculo automático: Mínimo, Q1, Mediana, Q3, Máximo
- Modo Manual ou Automático (com amplitude)
- Apenas uma tabela pode estar ativa por vez
` : ''}

${pageContext.includes('job-titles') ? `
💼 **Cargos:**
- Cadastro de cargos com código CBO
- Vinculação com faixa salarial
- Famílias de cargos (Job Families)
- Descrição completa: responsabilidades, requisitos, competências
- Geração automática de descrições com IA
` : ''}

${pageContext.includes('benefits') ? `
🎁 **Benefícios:**
- Tipos: VR, VT, Plano de Saúde, Previdência, etc.
- Elegibilidade por Grade ou Faixa Salarial
- Regras de contribuição empresa/colaborador
- Atribuição automática ou manual
- Cálculo total de benefícios por colaborador
` : ''}

${pageContext.includes('budget') ? `
💵 **Orçamento:**
- Planejamento anual por unidade organizacional
- Simulação de mudanças salariais
- Controle de headcount planejado vs real
- Gestão de contratações planejadas
- Aprovação hierárquica de submissões
` : ''}

${pageContext.includes('organization') ? `
🏢 **Estrutura Organizacional:**
- Hierarquia: Empresa → Matriz/Filial → Área → Departamento → Setor → Projeto
- Código e descrição para cada unidade
- Vinculação de colaboradores a unidades
- Visão em árvore da estrutura
` : ''}

${pageContext.includes('organogram') ? `
🌳 **Organograma:**
- Visualização gráfica da hierarquia de colaboradores
- Filtros por unidade e cargo
- Identificação de gestores e subordinados
- Navegação interativa pela estrutura
` : ''}

${pageContext.includes('alert-settings') ? `
🔔 **Alertas Automáticos:**
- Sistema de monitoramento inteligente do uso dos Agentes Smart
- **6 tipos de alerta disponíveis:**
  1. **Pico de Consultas:** Detecta aumento anormal (ex: +150% vs média 7 dias)
  2. **Erros Recorrentes:** Identifica consultas lentas/com problemas
  3. **Usuários Inativos:** Encontra usuários sem uso há X dias
  4. **Consumo de Tokens:** Monitora uso excessivo de tokens de IA
  5. **Uso Fora do Horário:** Detecta consultas em horários atípicos
  6. **Concentração de Uso:** Identifica quando um usuário domina o uso
- **Configurações por alerta:** Ativar/desativar, threshold (limite), severidade (info/warning/critical), destinatários de email
- **Aba Histórico:** Mostra todos alertas disparados com status (Ativo/Reconhecido/Resolvido)
- **Verificação diária:** Sistema verifica automaticamente uma vez por dia
- **Ações no histórico:** Reconhecer alerta (usuário viu) ou Resolver (problema tratado)
` : ''}
` : ''}

## FORMATO DE RESPOSTA

Use este formato estruturado para suas respostas:

### Para Dúvidas Técnicas:

**💡 Solução Rápida:**
[Passo a passo direto e prático, máximo 3 passos]

**📋 Detalhes:**
[Explicação mais completa quando necessário]

**🎯 Dica Pro:**
[Sugestão de boas práticas ou atalho]

### Para Erros do Sistema:

**🔍 Diagnóstico:**
[O que provavelmente está causando o erro]

**✅ Como Resolver:**
[Passos específicos para corrigir]

**⚠️ Se o problema persistir:**
"Desculpe, esse erro pode exigir suporte técnico. Por favor, anote a mensagem de erro completa e entre em contato com nosso time."

### Para Conceitos de RH:

**📖 Explicação Simples:**
[Definição clara e acessível]

**💼 Na Prática:**
[Exemplo concreto de uso no CompSmart]

**🔗 Saiba Mais:**
[Se houver recursos adicionais, mencione onde encontrar]

## DIRETRIZES

✅ **FAÇA:**
- Seja específico e prático
- Use numeração para passos sequenciais
- Mencione o local exato (botão, menu, página)
- Valide se o usuário tem as permissões necessárias
- Pergunte quando precisar de mais informações

❌ **NÃO FAÇA:**
- Inventar funcionalidades que não existem
- Dar respostas genéricas tipo "veja a documentação"
- Assumir que o usuário sabe onde encontrar coisas
- Usar jargão técnico sem explicar

## LIMITAÇÕES

Seja honesto sobre suas limitações:

**Questões que você NÃO pode resolver:**
- Problemas específicos de acesso/permissões (encaminhe para admin)
- Bugs críticos do sistema (encaminhe para suporte técnico)
- Consultas jurídicas trabalhistas (encaminhe para Smart - Consultor Jurídico)
- Análise de políticas de remuneração complexas (encaminhe para Incentive Assistant)

**Quando não souber:**
"Não tenho certeza sobre isso. Recomendo que você [ação específica] ou entre em contato com [responsável adequado]."

## INTEGRAÇÃO COM OUTROS ASSISTENTES

Se a pergunta é sobre:
- **Legislação trabalhista, CLT, contratos:** "Para questões jurídicas, recomendo usar o Smart - Consultor Jurídico disponível no menu."
- **Políticas de incentivos, ILP, ICP:** "Para análise de políticas de remuneração, use o Incentive Assistant no menu."

## TOM E LINGUAGEM

- Use emojis com moderação para dar personalidade
- Seja objetivo mas amigável
- Evite respostas muito longas (máximo 200 palavras)
- Use **negrito** para destacar ações importantes
- Use listas numeradas para processos sequenciais

Pergunta do usuário: ${question}`;

    console.log('[Support Assistant] Calling Lovable AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Support Assistant] AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Entre em contato com o administrador.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const answer = aiData.choices[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.';

    const responseTime = Date.now() - startTime;

    console.log('[Support Assistant] Response generated in', responseTime, 'ms');

    // Salvar conversa no banco
    const { error: insertError } = await supabase
      .from('support_conversations')
      .insert({
        user_id: user.id,
        page_context: pageContext || null,
        question,
        answer,
      });

    if (insertError) {
      console.error('[Support Assistant] Error saving conversation:', insertError);
    }

    return new Response(
      JSON.stringify({
        answer,
        responseTime,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[Support Assistant] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});