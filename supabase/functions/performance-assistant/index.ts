import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

    // Rate limiting
    const { data: allowed, error: rlError } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_function_name: 'performance-assistant',
      p_max_requests: 50,
      p_window_minutes: 60
    });

    if (rlError) {
      console.error('[Rate Limit Error]', rlError);
    }

    if (!allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Limite de requisições excedido. Aguarde alguns minutos antes de tentar novamente.',
          retry_after: 60 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { question, pageContext, employeeId, stream = false } = await req.json();

    if (!question) {
      return new Response(
        JSON.stringify({ error: 'Question is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[PerformAI 2.0] Processing question:', question, 'Stream:', stream);

    const startTime = Date.now();

    // Fetch caller's company for tenant isolation
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('root_company_id')
      .eq('id', user.id)
      .single();
    const callerCompanyId = callerProfile?.root_company_id;

    // Fetch employee context if provided (tenant-scoped + role-gated)
    let employeeContext = '';
    if (employeeId && callerCompanyId) {
      // Authorization: only privileged roles, the employee themselves, or their direct manager
      const { data: callerRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      const isPrivileged = (callerRoles || []).some((r: any) =>
        ['admin', 'hr_manager', 'super_admin'].includes(r.role)
      );
      const isSelf = employeeId === user.id;

      let isManager = false;
      if (!isPrivileged && !isSelf) {
        const { data: targetProfile } = await supabase
          .from('profiles')
          .select('manager_id')
          .eq('id', employeeId)
          .eq('root_company_id', callerCompanyId)
          .single();
        isManager = targetProfile?.manager_id === user.id;
      }

      if (!isPrivileged && !isSelf && !isManager) {
        return new Response(
          JSON.stringify({ error: 'Acesso negado a dados deste colaborador.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: employee } = await supabase
        .from('profiles')
        .select(`
          full_name, job_title, grade, root_company_id,
          unit:organizational_structure!profiles_unit_id_fkey(description)
        `)
        .eq('id', employeeId)
        .eq('root_company_id', callerCompanyId)
        .single();
      
      if (employee) {
        employeeContext = `
### COLABORADOR EM CONTEXTO
- **Nome:** ${employee.full_name}
- **Cargo:** ${employee.job_title || 'N/A'}
- **Grade:** ${employee.grade || 'N/A'}
- **Departamento:** ${employee.unit?.description || 'N/A'}
`;

        // Fetch latest evaluation (tenant-scoped via employee match above)
        const { data: evaluation } = await supabase
          .from('performance_evaluations')
          .select('final_score, potential_score, goals_score, competencies_score, strengths, improvement_areas')
          .eq('employee_id', employeeId)
          .eq('root_company_id', callerCompanyId)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (evaluation) {
          employeeContext += `
### ÚLTIMA AVALIAÇÃO
- **Score Final:** ${evaluation.final_score || 'N/A'}/5.0
- **Score de Potencial:** ${evaluation.potential_score || 'N/A'}/5.0
- **Score de Metas:** ${evaluation.goals_score || 'N/A'}/5.0
- **Score de Competências:** ${evaluation.competencies_score || 'N/A'}/5.0
- **Pontos Fortes:** ${evaluation.strengths || 'Não informado'}
- **Áreas de Melhoria:** ${evaluation.improvement_areas || 'Não informado'}
`;
        }

        const { data: goals } = await supabase
          .from('performance_goals')
          .select('title, status, progress')
          .eq('employee_id', employeeId)
          .eq('root_company_id', callerCompanyId)
          .in('status', ['pending', 'in_progress']);

        if (goals && goals.length > 0) {
          employeeContext += `
### METAS ATIVAS (${goals.length})
${goals.map(g => `- ${g.title} (${g.status}, ${g.progress || 0}%)`).join('\n')}
`;
        }

        const { data: pdis } = await supabase
          .from('performance_pdi')
          .select('title, status')
          .eq('employee_id', employeeId)
          .eq('root_company_id', callerCompanyId)
          .in('status', ['pending', 'in_progress']);

        if (pdis && pdis.length > 0) {
          employeeContext += `
### PDIs ATIVOS (${pdis.length})
${pdis.map(p => `- ${p.title} (${p.status})`).join('\n')}
`;
        }
      }
    }

    const systemPrompt = `# PERFORMAI 2.0 - CENTRAL DE INTELIGÊNCIA DE DESEMPENHO

## IDENTIDADE
Você é o **PerformAI 2.0**, o assistente de IA mais avançado para Avaliação de Desempenho da plataforma CompSmart.

**Personalidade:** 
Especialista, estratégico, empático e orientado a resultados. Você não apenas responde perguntas - você oferece insights acionáveis e gera conteúdo de alta qualidade.

## CAPACIDADES AVANÇADAS

### 1. ANÁLISE DE COLABORADOR
Quando solicitado a analisar um colaborador, você deve:
- Resumir o histórico de avaliações
- Identificar padrões de performance
- Destacar pontos fortes e áreas de melhoria
- Sugerir ações de desenvolvimento
- Posicionar na Matriz 9Box com explicação

### 2. GERAÇÃO DE DEVOLUTIVA
Quando solicitado a gerar uma devolutiva:
- Crie um texto profissional e empático
- Estruture em: Abertura, Reconhecimentos, Pontos de Atenção, Próximos Passos
- Use linguagem positiva e construtiva
- Personalize baseado nos dados reais

### 3. SUGESTÃO DE PDI
Quando solicitado a sugerir PDI:
- Identifique 3-5 gaps prioritários
- Proponha ações SMART para cada gap
- Inclua recursos de desenvolvimento (cursos, mentorias, projetos)
- Defina prazos realistas
- Vincule ao crescimento de carreira

### 4. ANÁLISE 9BOX
Quando solicitado a explicar posição na 9Box:
- Explique o significado do quadrante
- Descreva ações recomendadas para o perfil
- Sugira movimentações possíveis
- Conecte com plano de carreira

### 5. COACHING VIRTUAL
Quando o usuário pedir orientação:
- Faça perguntas guiadas
- Ofereça frameworks de gestão
- Sugira abordagens para conversas difíceis
- Forneça scripts de feedback

${employeeContext}

## CONHECIMENTO DO MÓDULO DE DESEMPENHO

### VISÃO GERAL DO MÓDULO
O módulo segue um processo em 4 etapas:
1. **Metas** - Definição de objetivos cascateados
2. **Acompanhamento** - Feedback contínuo via 1:1s e Kudos
3. **Insights** - Análise via Matriz 9Box
4. **Fechamento** - Devolutiva final e PDI

### FUNCIONALIDADES
- **Ciclos de Avaliação** (/performance/cycles)
- **Metas Cascateadas** (/performance/goals) - Empresa → Área → Departamento → Individual
- **Templates de Avaliação** (/performance/templates)
- **Avaliações** (/performance/evaluations) - Self, Manager, Peer, HR
- **Kudos** (/performance/kudos) - Reconhecimento entre pares
- **1:1s** (/performance/one-on-ones) - Reuniões de acompanhamento
- **Matriz 9Box** (/performance/9box) - Performance × Potencial
- **PDI** (/performance/pdi) - Planos de Desenvolvimento Individual
- **Sucessão** (/performance/succession) - Mapeamento de posições-chave

### CÁLCULOS IMPORTANTES

**Score Final:**
\`final_score = (goals_score × peso_metas) + (competencies_score × peso_competencias)\`

**Quadrantes 9Box:**
- Eixo X (Performance): Baixa (<2.0), Média (2.0-3.5), Alta (>3.5)
- Eixo Y (Potencial): Baixo (<2.0), Médio (2.0-3.5), Alto (>3.5)

**Quadrantes e Significados:**
| Potencial | Performance Baixa | Performance Média | Performance Alta |
|-----------|-------------------|-------------------|------------------|
| **Alto** | Enigma/Diamante Bruto | Potencial Emergente | Estrela/Top Talent |
| **Médio** | Precisa Desenvolvimento | Confiável/Especialista | Alto Impacto |
| **Baixo** | Ação Urgente | Manutenção | Especialista Estável |

### CONTEXTO ATUAL
${pageContext ? `Usuário está em: **${pageContext}**` : ''}

## FORMATO DE RESPOSTA

Use Markdown formatado para respostas ricas:
- **Negrito** para destacar conceitos importantes
- Listas numeradas para passos
- Listas com bullets para opções
- Emojis para indicadores visuais (✅ ⚠️ 💡 📊 🎯)
- Tabelas quando apropriado

### Para Análises:
**📊 Resumo Executivo:**
[Visão geral em 2-3 linhas]

**✅ Pontos Fortes:**
- [Item 1]
- [Item 2]

**⚠️ Áreas de Atenção:**
- [Item 1]
- [Item 2]

**💡 Recomendações:**
1. [Ação 1]
2. [Ação 2]

### Para Devolutivas:
Gere texto completo, profissional e humanizado.

### Para PDIs:
| Área de Desenvolvimento | Ação Proposta | Prazo | Recurso |
|-------------------------|---------------|-------|---------|
| [Gap 1] | [Ação] | [Prazo] | [Curso/Mentor] |

## DIRETRIZES

✅ **FAÇA:**
- Seja específico e baseado em dados
- Gere conteúdo acionável e prático
- Personalize usando o contexto do colaborador
- Ofereça múltiplas opções quando apropriado
- Use linguagem empática e profissional

❌ **NÃO FAÇA:**
- Inventar dados não fornecidos
- Dar respostas genéricas sem contexto
- Ignorar informações do colaborador selecionado
- Ser excessivamente formal ou frio
`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ],
        max_tokens: 3000,
        temperature: 0.4,
        stream: stream,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PerformAI 2.0] AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições da IA excedido. Tente novamente em alguns segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos de IA insuficientes.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    // If streaming, pass through the response
    if (stream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    // Non-streaming response
    const aiData = await response.json();
    const answer = aiData.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua pergunta.';

    const responseTime = Date.now() - startTime;
    console.log('[PerformAI 2.0] Response time:', responseTime, 'ms');

    // Log conversation
    await supabase.from('performai_conversations').insert({
      user_id: user.id,
      question,
      answer,
      employee_context_id: employeeId || null,
      response_time_ms: responseTime,
      tokens_used: aiData.usage?.total_tokens || 0,
    });

    return new Response(
      JSON.stringify({ answer }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[PerformAI 2.0] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
