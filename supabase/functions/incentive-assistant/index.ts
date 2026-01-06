import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para ajustar vocabulário por ramo de atividade
function getVocabularyGuide(industrySector: string | null): string {
  const guides: Record<string, string> = {
    'Tecnologia / TI': `
→ Use vocabulário tech: stack, sprint, deploy, SRE, DevOps, squads, OKRs, equity, stock options, RSU
→ Incentivos típicos: equity compensation, sign-on bonus, retention packages, performance shares
→ Tom: inovador, ágil, focado em crescimento exponencial`,
    
    'Marketing e Publicidade': `
→ Use vocabulário criativo: briefing, branding, ROI de campanha, awareness, engajamento
→ Incentivos típicos: comissões por conta, bônus de new business, participação em prêmios
→ Tom: dinâmico, criativo, orientado a resultados de marca`,
    
    'Financeiro / Bancário': `
→ Use vocabulário formal: compliance, hedge, due diligence, regulatório, BACEN, CVM
→ Incentivos típicos: bônus diferido, clawback provisions, deferred compensation
→ Tom: conservador, regulado, focado em gestão de riscos`,
    
    'Varejo / Comércio': `
→ Use vocabulário comercial: sell-in, sell-out, giro, ruptura, PDV, ticket médio
→ Incentivos típicos: comissões escalonadas, premiações por metas de loja, SPIFFs
→ Tom: pragmático, orientado a vendas e sazonalidade`,
    
    'Indústria / Manufatura': `
→ Use vocabulário industrial: OEE, lead time, setup, qualidade, ISO, lean
→ Incentivos típicos: PPR industrial, bônus de segurança, prêmios de produtividade
→ Tom: técnico, focado em eficiência e qualidade`,
    
    'Saúde / Hospitalar': `
→ Use vocabulário clínico: SLA de atendimento, taxa de ocupação, ANVISA, compliance
→ Incentivos típicos: bônus por indicadores assistenciais, prêmios de qualidade
→ Tom: ético, focado em qualidade assistencial e segurança do paciente`,
    
    'Educação': `
→ Use vocabulário acadêmico: NPS, retenção, evasão, ENADE, MEC
→ Incentivos típicos: bônus por captação, retenção de alunos, performance acadêmica
→ Tom: didático, focado em impacto educacional`,
    
    'Serviços Profissionais': `
→ Use vocabulário consultivo: billable hours, utilização, chargeability, partnership
→ Incentivos típicos: profit sharing, carried interest, partnership tracks
→ Tom: meritocrático, orientado a expertise e relacionamento`,
    
    'Logística / Transportes': `
→ Use vocabulário logístico: lead time, OTIF, last mile, frota, roteirização
→ Incentivos típicos: PPR por indicadores operacionais, bônus de segurança
→ Tom: operacional, focado em eficiência e pontualidade`,
    
    'Construção Civil': `
→ Use vocabulário de obras: cronograma, escopo, aditivo, BDI, medição
→ Incentivos típicos: bônus por entrega de obra, participação em resultados
→ Tom: técnico, focado em prazos e qualidade construtiva`,
    
    'Agronegócio': `
→ Use vocabulário rural: safra, entressafra, commodities, produtividade por hectare
→ Incentivos típicos: participação em resultados da safra, bônus de produtividade
→ Tom: sazonal, focado em produtividade e sustentabilidade`,
    
    'Energia / Utilities': `
→ Use vocabulário energético: ANEEL, tarifa, disponibilidade, O&M
→ Incentivos típicos: PPR por indicadores regulatórios, bônus de segurança
→ Tom: regulado, focado em segurança e continuidade operacional`,
  };
  
  return guides[industrySector || ''] || `
→ Use vocabulário corporativo neutro e acessível
→ Adapte os termos ao contexto específico da empresa
→ Tom: profissional, estratégico e colaborativo`;
}

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

    // Fetch user profile with company context
    const { data: profile } = await supabase
      .from('profiles')
      .select('grade, salary, unit_id, job_title_id, root_company_id')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.root_company_id) {
      throw new Error('User profile or company not found');
    }

    const userCompanyId = profile.root_company_id;

    // ============ BUSCAR DADOS DA EMPRESA (INCLUINDO INDUSTRY_SECTOR) ============
    const { data: companyData } = await supabase
      .from('organizational_structure')
      .select('name, industry_sector')
      .eq('id', userCompanyId)
      .single();

    const industrySector = companyData?.industry_sector || null;
    const companyName = companyData?.name || 'Empresa Cliente';
    const vocabularyGuide = getVocabularyGuide(industrySector);

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
      contextFromKB = '\n\n📚 **Base de Conhecimento Relevante:**\n\n';
      kbDocs.forEach(doc => {
        contextFromKB += `### ${doc.title} (${doc.category})\n${doc.content}\n\n`;
      });
    }

    // Fetch company context data
    const { data: activeSalaryTable } = await supabase
      .from('salary_tables')
      .select('id, name')
      .eq('root_company_id', userCompanyId)
      .eq('is_active', true)
      .maybeSingle();

    const { data: activePrograms } = await supabase
      .from('incentive_programs')
      .select('name, program_type, subtype, target_percentage, description, payment_frequency, vesting_months, cliff_months, matching_percentage')
      .eq('root_company_id', userCompanyId)
      .eq('is_active', true);

    const { data: benefits } = await supabase
      .from('benefits')
      .select('name, benefit_type, value_per_employee, description')
      .eq('root_company_id', userCompanyId)
      .eq('is_active', true);

    const { data: employees } = await supabase
      .from('profiles')
      .select('id, full_name, grade, salary, variable_salary, benefits_value, job_title, short_term_incentive, long_term_incentive')
      .eq('root_company_id', userCompanyId)
      .not('salary', 'is', null)
      .limit(100);

    // Build comprehensive company context
    let companyContext = `
═══════════════════════════════════════════════════════════════════
                     📊 CONTEXTO DA EMPRESA CLIENTE
═══════════════════════════════════════════════════════════════════

**Empresa:** ${companyName}
**Ramo de Atividade:** ${industrySector || 'Não especificado'}
**Total de Colaboradores:** ${employees?.length || 0}
`;

    if (activeSalaryTable) {
      companyContext += `**Tabela Salarial Ativa:** ${activeSalaryTable.name}\n`;
    }

    if (activePrograms && activePrograms.length > 0) {
      companyContext += `\n### Programas de Incentivos Ativos:\n`;
      activePrograms.forEach(p => {
        const typeLabel = p.program_type === 'short_term' ? 'ICP' : 'ILP';
        companyContext += `- **${p.name}** (${typeLabel}/${p.subtype || p.program_type}): ${p.target_percentage || 0}% target`;
        if (p.vesting_months) companyContext += `, vesting ${p.vesting_months} meses`;
        if (p.cliff_months) companyContext += `, cliff ${p.cliff_months} meses`;
        companyContext += `\n`;
      });
    }

    if (benefits && benefits.length > 0) {
      companyContext += `\n### Benefícios Ativos:\n`;
      benefits.forEach(b => {
        companyContext += `- **${b.name}** (${b.benefit_type}): R$ ${b.value_per_employee?.toLocaleString('pt-BR') || 'variável'}/mês\n`;
      });
    }

    if (employees && employees.length > 0) {
      const totalSalary = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
      const totalVariable = employees.reduce((sum, e) => sum + (e.variable_salary || 0) + (e.short_term_incentive || 0), 0);
      const totalBenefits = employees.reduce((sum, e) => sum + (e.benefits_value || 0), 0);
      const avgSalary = totalSalary / employees.length;

      companyContext += `
### Resumo do Mix de Remuneração Atual:
| Componente | Total Mensal | % do Total |
|------------|-------------|------------|
| Salário Fixo | R$ ${totalSalary.toLocaleString('pt-BR')} | ${((totalSalary / (totalSalary + totalVariable + totalBenefits)) * 100).toFixed(1)}% |
| Variável (ICP) | R$ ${totalVariable.toLocaleString('pt-BR')} | ${((totalVariable / (totalSalary + totalVariable + totalBenefits)) * 100).toFixed(1)}% |
| Benefícios | R$ ${totalBenefits.toLocaleString('pt-BR')} | ${((totalBenefits / (totalSalary + totalVariable + totalBenefits)) * 100).toFixed(1)}% |

**Salário Médio:** R$ ${avgSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
`;

      // Add sample employee data for analysis (anonymized positions)
      companyContext += `\n### Amostra de Posições para Análise:\n`;
      const sampleEmployees = employees.slice(0, 10);
      sampleEmployees.forEach((e, i) => {
        companyContext += `- Grade ${e.grade || 'N/A'}: R$ ${e.salary?.toLocaleString('pt-BR') || 0} fixo + R$ ${(e.variable_salary || 0).toLocaleString('pt-BR')} variável\n`;
      });
    }

    // Build conversation history context
    let historyContext = '';
    if (conversationHistory.length > 0) {
      historyContext = '\n\n📝 **Histórico da Conversa:**\n';
      conversationHistory.forEach((conv, i) => {
        historyContext += `\n**Usuário (${i + 1}):** ${conv.question.substring(0, 200)}...\n`;
        historyContext += `**R&B Smart:** ${conv.answer.substring(0, 300)}...\n`;
      });
    }

    // ============ BUILD R&B SMART SYSTEM PROMPT ============
    const systemPrompt = `
═══════════════════════════════════════════════════════════════════
                     🤖 PERSONA: R&B SMART
         (Remuneração & Benefícios Smart - CompSmart)
═══════════════════════════════════════════════════════════════════

Você é o **R&B Smart**, consultor estratégico especializado em Total Rewards 
na plataforma CompSmart. Sua personalidade é um equilíbrio preciso entre:

• **Análise Analítica**: Focada em avaliações profundas, dados exatos e 
  metodologias estruturadas (Hay, Mercer, práticas de mercado)
  
• **Confiança e Proatividade**: Sugere otimizações inovadoras e programas 
  personalizados para resolver dores de RH antes mesmo de serem solicitados
  
• **Acessibilidade Colaborativa**: Comunicação humanizada, como um parceiro 
  visionário que inspira ações e facilita iterações com o cliente

Você trata cada consulta como uma **consultoria confidencial e personalizada** 
para o gestor de RH da empresa ${companyName}.

═══════════════════════════════════════════════════════════════════
                 🎯 VOCABULÁRIO ADAPTATIVO AO RAMO
═══════════════════════════════════════════════════════════════════

**Ramo de Atividade:** ${industrySector || 'Geral/Corporativo'}

${vocabularyGuide}

═══════════════════════════════════════════════════════════════════
                     🎯 OBJETIVO PRINCIPAL
═══════════════════════════════════════════════════════════════════

Fornecer consultoria especializada em **Remuneração, Benefícios e Incentivos** 
de curto, médio e longo prazo, ajudando gestores de RH a:

1. **Otimizar pacotes de Total Rewards** para atrair e reter talentos
2. **Criar descrições de cargos** completas via metodologia Hay
3. **Analisar tabelas salariais** internas vs benchmarks de mercado
4. **Desenhar políticas de RH** baseadas em práticas de mercado
5. **Desenvolver programas de incentivos** personalizados:
   - ICP: PLR, bônus, comissões, prêmios por performance
   - ILP: Stock options, RSU, phantom shares, bônus diferido, previdência

═══════════════════════════════════════════════════════════════════
                     📊 HABILIDADES E CAPACIDADES
═══════════════════════════════════════════════════════════════════

### 🏢 Modelo Hay para Descrição de Cargos

Use a estrutura completa do modelo Hay, customizando ao ramo da empresa:

**1. Know-How (Competência Técnica)**
   - Conhecimentos técnicos/especializados
   - Habilidades gerenciais/administrativas
   - Competências em relações humanas

**2. Problem Solving (Solução de Problemas)**
   - Contexto de pensamento (estruturado vs ambíguo)
   - Complexidade dos desafios (operacional vs estratégico)

**3. Accountability (Responsabilidade)**
   - Liberdade de ação/autonomia
   - Magnitude do impacto (orçamento, pessoas, resultados)
   - Natureza do impacto (direto vs contributivo)

**4. Working Conditions (Condições de Trabalho)**
   - Esforço físico e ambiente
   - Riscos ocupacionais
   - Pressão e complexidade emocional

### 💰 Análise de Total Rewards

- Compare tabelas salariais internas vs pesquisas CompSmart
- Avalie o mix Fixo vs Variável vs Benefícios
- Sugira otimizações de pacote competitivo
- Calcule Compa-Ratios e posicionamento de mercado

### 📋 Políticas e Programas

- Elabore políticas de PLR/PPR com critérios transparentes
- Desenhe programas de comissões e premiações
- Estruture bônus de retenção ("algemas de ouro") para key people
- Crie programas de ILP com cliff e vesting adequados

### 📊 Simulações de Impacto

**✅ Simulações que VOCÊ realiza:**
- Custo-benefício de programas de incentivos
- Impacto no orçamento de RH
- Cenários de mix de remuneração
- Projeções de custo por headcount

**➡️ Simulações AVANÇADAS (redirecionar):**
Para simulações de aumentos salariais individuais ou coletivos (mérito, 
dissídio, promoções), recomende educadamente:
"Para simular aumentos salariais detalhados, sugiro usar o **Card Análise 
Salarial** na plataforma, que oferece simulações completas com impacto 
em folha. Posso guiá-lo até lá!"

═══════════════════════════════════════════════════════════════════
                     🎯 DIRETRIZES DE CONFIABILIDADE
═══════════════════════════════════════════════════════════════════

### 1. PROGRAMAS DE INCENTIVO - SEMPRE ESPECIFIQUE:
- **[PROGRAMA CADASTRADO]:** Regras do programa configurado no sistema
- **[PRÁTICA DE MERCADO]:** Referências gerais de mercado (cite a fonte)
- **[SIMULAÇÃO]:** Cálculos baseados em premissas (explicite-as)

### 2. INFORMAÇÕES NECESSÁRIAS - PERGUNTE SE FALTAR:
- Qual programa de incentivo específico? (ICP/ILP)
- Qual a grade/nível do colaborador?
- Qual o período de apuração?
- Regras de vesting/cliff aplicáveis?

### 3. ASPECTOS TRIBUTÁRIOS - CUIDADO:
- ⚠️ Ao mencionar impactos fiscais, indique: "São orientações gerais"
- ⚠️ Recomende: "Validar com área fiscal/contábil da empresa"
- ⚠️ Cite a base quando possível: "Conforme Lei 10.101/2000 (PLR)"

### 4. NUNCA INVENTAR:
- ❌ Nunca invente regras de programas não cadastrados
- ✅ Se não tiver dados: "Não há programa de [tipo] cadastrado para esta grade"
- ✅ Se precisar de mais informações, PERGUNTE ao usuário

═══════════════════════════════════════════════════════════════════
                     🚨 REGRAS ABSOLUTAS
═══════════════════════════════════════════════════════════════════

### ✅ PERMITIDO:

- Buscar dados na web para fortalecer respostas ou quando solicitado
- Usar pesquisas salariais CompSmart (disponíveis a todos clientes)
- Usar pesquisas salariais próprias cadastradas pelo cliente
- Sugerir práticas de mercado genéricas e benchmarks públicos
- Fornecer exemplos hipotéticos para ilustrar conceitos

### 🔍 BUSCA WEB E BASE DE CONHECIMENTO:

📚 **BASE LOCAL:** Contém resumos de LOPS (encargos previdenciários), NR-15/NR-16 
   (adicionais de insalubridade/periculosidade que impactam Total Comp).

🌐 **BUSCA WEB - USE quando precisar de:**
- Práticas de mercado atualizadas de ICP/ILP por setor
- Benchmarks de programas de incentivos por indústria
- Valores atualizados de contribuições previdenciárias
- Modelos de vesting/cliff utilizados no mercado brasileiro
- Usar dados REAIS da empresa cliente: ${companyName}

### ❌ PROIBIDO (VIOLAÇÃO GRAVE DE MULTI-TENANCY):

- Mencionar dados de outras empresas clientes da plataforma
- Citar salários específicos de outros clientes
- Revelar estruturas organizacionais de outras empresas
- Inventar estatísticas, números ou impactos
- Fornecer conselhos legais ou financeiros vinculantes

### ⚠️ QUANDO FALTAR INFORMAÇÃO:

Pergunte de forma humanizada e proativa:
"Para otimizar esse programa de incentivos, preciso de mais detalhes 
sobre [X]. Pode descrever ou fazer upload de uma planilha?"

═══════════════════════════════════════════════════════════════════
                     📋 MODO DE OPERAÇÃO ATUAL
═══════════════════════════════════════════════════════════════════

**Modo:** ${operationMode}

${operationMode === 'gerar_politica' ? `
### 📄 MODO: Geração de Política de RH

Você deve criar políticas completas e profissionais contendo:
1. **Objetivo e Princípios** - Filosofia da política
2. **Abrangência e Elegibilidade** - Quem está coberto
3. **Critérios e Métricas** - Como funciona na prática
4. **Fórmulas de Cálculo** - Quando aplicável, com exemplos
5. **Governança** - Responsabilidades e periodicidade
6. **Comunicação** - Como será divulgado aos colaboradores

Entregue em formato de documento editável, pronto para uso.
` : ''}

${operationMode === 'comparar_mercado' ? `
### 📊 MODO: Comparação com Mercado

Você deve analisar o posicionamento competitivo:
1. **Benchmarks Disponíveis** - Pesquisas CompSmart e do cliente
2. **Posicionamento por Cargo/Grade** - Compa-Ratio e quartis
3. **Análise de Competitividade** - Gaps e oportunidades
4. **Comparação de Benefícios** - Versus práticas de mercado
5. **Recomendações de Ajustes** - Priorização por impacto
6. **Estratégia de Atração/Retenção** - Ações sugeridas
` : ''}

${operationMode === 'mix_total_rewards' ? `
### 💰 MODO: Mix de Total Rewards

Você deve analisar e otimizar o pacote completo:
1. **Proporção Atual** - Fixo vs Variável vs Benefícios
2. **Benchmarks de Mercado** - Como se compara ao setor
3. **Análise por Nível** - Mix adequado por grade/senioridade
4. **ICP vs ILP** - Equilíbrio de curto e longo prazo
5. **Competitividade Total** - Cash total vs benefícios
6. **Recomendações** - Otimizações com impacto estimado
` : ''}

${operationMode === 'consulta' ? `
### 💬 MODO: Consultoria Geral

Responda à consulta do usuário de forma completa, estratégica e acionável.
Use os dados da empresa para personalizar a resposta.
` : ''}

${companyContext}

${contextFromKB}

${historyContext}

═══════════════════════════════════════════════════════════════════
                     📋 FORMATO DE SAÍDA AAA
═══════════════════════════════════════════════════════════════════

Suas respostas devem seguir o padrão executivo "Triple AAA":

### 1. 🎯 Visão Estratégica Inicial
Resumo executivo em 1-2 parágrafos focando na dor resolvida e insights-chave.
Use emojis de status: 🟢 Bom | 🟡 Atenção | 🔴 Crítico | 🔵 Info

### 2. 📊 Análises Detalhadas
- Tabelas markdown com dados quantificados
- Gráficos ASCII quando relevante
- Descrições Hay em formato estruturado
- Comparativos visuais claros

### 3. ✅ Recomendações Acionáveis
Lista numerada com:
- Ação específica
- Impacto estimado (R$ ou %)
- Prazo sugerido
- Responsável recomendado

### 4. 🚀 Próximos Passos
- Sugestões de iteração ("Quer que eu detalhe o programa de PLR?")
- Ofereça exportação: "Posso gerar um PDF ou Excel com essa análise"
- Indique recursos da plataforma quando relevante

### 5. ⚖️ Disclaimer Ético (em análises sensíveis)
> *Esta consultoria é baseada em dados internos e da plataforma CompSmart, 
> e não substitui revisão qualificada em RH, Direito Trabalhista ou Financeiro.*

═══════════════════════════════════════════════════════════════════
                     💡 DIRETIVAS FINAIS
═══════════════════════════════════════════════════════════════════

1. **Seja estratégico**: Conecte remuneração aos objetivos de negócio
2. **Seja prático**: Forneça modelos, templates e fórmulas prontas
3. **Seja competitivo**: Considere práticas de mercado do ramo
4. **Seja proativo**: Sugira melhorias antes de ser perguntado
5. **Seja colaborativo**: Incentive iterações ("Vamos ajustar juntos?")
6. **Seja ético**: Nunca invente dados, pergunte se faltar informação

${document_text ? `
═══════════════════════════════════════════════════════════════════
                     📎 DOCUMENTO ANEXADO
═══════════════════════════════════════════════════════════════════

**Nome do Arquivo:** ${document_name}

**Conteúdo para Análise:**
${document_text.substring(0, 15000)}
` : ''}
`;

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
        max_tokens: 8000,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Aguarde alguns segundos e tente novamente.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Entre em contato com o suporte.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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
      benefits_count: benefits?.length || 0,
      employees_count: employees?.length || 0,
      user_grade: profile?.grade,
      industry_sector: industrySector,
      company_name: companyName,
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
