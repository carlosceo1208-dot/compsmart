import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============ FUNÇÃO DE EXTRAÇÃO DE FONTES SALARIAIS ============
interface SalarySource {
  source_type: string;
  source_reference: string;
  source_category: string;
  citation_context: string;
}

function extractSalarySources(text: string): SalarySource[] {
  const sources: SalarySource[] = [];
  const seen = new Set<string>();

  // 1. Dados internos da empresa
  const internalRegex = /\[DADOS?\s*INTERNO?S?\]|\bcolaboradores?\s+(?:da empresa|internos?)\b|\bfolha\s+de\s+pagamento\b|\bdados?\s+reais?\b/gi;
  let match;
  while ((match = internalRegex.exec(text)) !== null) {
    const ref = 'Dados Internos da Empresa';
    const key = ref.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      const start = Math.max(0, match.index - 30);
      const end = Math.min(text.length, match.index + match[0].length + 30);
      sources.push({
        source_type: 'dados_internos',
        source_reference: ref,
        source_category: 'CompSmart',
        citation_context: text.substring(start, end).trim()
      });
    }
  }

  // 2. Pesquisas de mercado / surveys
  const surveyRegex = /\[PESQUISA\s*(?:DE\s*)?MERCADO\]|\bpesquisa\s+salarial\b|\bsurvey\b|\bbenchmark(?:ing)?\b|\bdados?\s+de\s+mercado\b/gi;
  while ((match = surveyRegex.exec(text)) !== null) {
    const ref = 'Pesquisa Salarial de Mercado';
    const key = ref.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      const start = Math.max(0, match.index - 30);
      const end = Math.min(text.length, match.index + match[0].length + 30);
      sources.push({
        source_type: 'pesquisa_mercado',
        source_reference: ref,
        source_category: 'Benchmark',
        citation_context: text.substring(start, end).trim()
      });
    }
  }

  // 3. Cálculos e fórmulas
  const calcRegex = /\[CÁLCULO\]|\bcompa[-\s]?ratio\b|\bCR\s*[=:]\s*\d+%?|\bpercentual\s+(?:da\s+)?faixa\b|\b(?:mínimo|mediana|máximo)\s+da\s+faixa\b/gi;
  while ((match = calcRegex.exec(text)) !== null) {
    const ref = 'Cálculo CompSmart';
    const key = ref.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      const start = Math.max(0, match.index - 30);
      const end = Math.min(text.length, match.index + match[0].length + 30);
      sources.push({
        source_type: 'calculo',
        source_reference: ref,
        source_category: 'Fórmula',
        citation_context: text.substring(start, end).trim()
      });
    }
  }

  // 4. Tabela salarial ativa
  const tableRegex = /\btabela\s+salarial\b|\bfaixa(?:s)?\s+salarial(?:is)?\b|\bgrades?\s+(?:\d+|[A-Z]+)\b/gi;
  while ((match = tableRegex.exec(text)) !== null) {
    const ref = 'Tabela Salarial Ativa';
    const key = ref.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      const start = Math.max(0, match.index - 30);
      const end = Math.min(text.length, match.index + match[0].length + 30);
      sources.push({
        source_type: 'tabela_salarial',
        source_reference: ref,
        source_category: 'CompSmart',
        citation_context: text.substring(start, end).trim()
      });
    }
  }

  // 5. Índices econômicos
  const indexRegex = /\b(INPC|IPCA|IGP-M|IGPM|IPC(?:A)?)\b\s*(?:acumulado|mensal|anual)?/gi;
  while ((match = indexRegex.exec(text)) !== null) {
    const ref = `Índice ${match[1].toUpperCase()}`;
    const key = ref.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      const start = Math.max(0, match.index - 30);
      const end = Math.min(text.length, match.index + match[0].length + 30);
      sources.push({
        source_type: 'indice_economico',
        source_reference: ref,
        source_category: 'Economia',
        citation_context: text.substring(start, end).trim()
      });
    }
  }

  return sources;
}

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

    // ============ ROLE CHECK (admin / hr_manager / super_admin) ============
    const serviceSupabase = createClient(supabaseUrl, supabaseKey);
    const { data: callerRoles } = await serviceSupabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    const allowedRoles = ['admin', 'hr_manager', 'super_admin'];
    const hasAccess = (callerRoles || []).some((r: any) => allowedRoles.includes(r.role));
    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Este recurso é restrito a administradores e RH.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============ RATE LIMITING (30 requests/hora) ============
    const { data: allowed, error: rlError } = await serviceSupabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_function_name: 'salary-assistant',
      p_max_requests: 30,
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

    // Buscar dados da empresa incluindo industry_sector
    const { data: companyData } = await supabase
      .from('organizational_structure')
      .select('name, fantasy_name, industry_sector')
      .eq('type', 'company')
      .eq('id', profile.root_company_id)
      .single();

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
      .eq('root_company_id', profile.root_company_id)
      .eq('is_active', true)
      .limit(100);

    // Buscar dados de pesquisas salariais ativas (cliente + templates CompSmart globais)
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
      .or(`root_company_id.eq.${profile.root_company_id},root_company_id.is.null`)
      .eq('is_active', true)
      .limit(5);

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

    // Formatar pesquisas salariais disponíveis
    const surveyDataForPrompt = surveyTables?.map((survey: any) => {
      const dataLines = survey.survey_data?.slice(0, 10).map((d: any) => 
        `| ${d.job_title} | ${d.grade} | R$ ${d.min_value?.toLocaleString('pt-BR') || 'N/A'} | R$ ${d.median_value?.toLocaleString('pt-BR') || 'N/A'} | R$ ${d.max_value?.toLocaleString('pt-BR') || 'N/A'} |`
      ).join('\n') || '';
      return `📊 ${survey.name} (${survey.effective_month}/${survey.effective_year}):\n${dataLines}`;
    }).join('\n\n') || 'Nenhuma pesquisa salarial configurada';

    // Determinar vocabulário baseado no ramo de atividade
    const industrySector = companyData?.industry_sector || 'Não informado';
    const companyName = companyData?.fantasy_name || companyData?.name || 'Empresa';

    const vocabularyGuide = getVocabularyGuide(industrySector);

    // System prompt otimizado com persona Salary Smart
    const systemPrompt = `Você é o **Salary Smart**, consultor sênior de remuneração estratégica da plataforma CompSmart.

═══════════════════════════════════════════════════════════════════════════════
                          🤖 SUA PERSONA
═══════════════════════════════════════════════════════════════════════════════

**PERSONALIDADE:** Você é um equilíbrio preciso entre:
- **Analítico**: Focado em dados exatos e insights profundos
- **Proativo**: Sugerindo ações acionáveis para otimizar estruturas salariais
- **Colaborativo**: Comunicação humanizada, como parceiro de RH experiente

**EMPRESA CLIENTE:** ${companyName}
**RAMO DE ATIVIDADE:** ${industrySector}

📌 **AJUSTE DE VOCABULÁRIO:**
${vocabularyGuide}

⚠️ **TERMINOLOGIA OBRIGATÓRIA:** 
- Sempre use "**colaborador(es)**" ao invés de "funcionário(s)"
- Trate as pessoas como "colaboradores" em todas as análises, relatórios e comunicações

💡 **"Tempo é dinheiro"** - Seja objetivo, visual e prático. Foque especialmente em "key people" (talentos principais) e análises que economizam tempo e reduzem riscos de perda de colaboradores estratégicos.

═══════════════════════════════════════════════════════════════════════════════
                          🎯 DIRETRIZ DE QUALIDADE AAA
═══════════════════════════════════════════════════════════════════════════════

**VOCÊ ENTREGA RELATÓRIOS DE QUALIDADE EXECUTIVA.** Suas análises são destinadas a:
- Diretores de RH
- CEOs e C-Level
- Comitês de Remuneração
- Conselhos de Administração

**PADRÃO OBRIGATÓRIO DE ENTREGA:**

1. **TABELAS FORMATADAS** - Sempre use tabelas markdown com alinhamento correto
2. **GRÁFICOS ASCII/TENDÊNCIAS** - Represente visualmente distribuições e comparações
3. **CORES/EMOJIS DE STATUS** - 🟢 Verde (OK) | 🟡 Amarelo (Atenção) | 🔴 Vermelho (Crítico)
4. **MÉTRICAS QUANTIFICADAS** - Nunca descreva, sempre calcule e mostre números
5. **RECOMENDAÇÕES ACIONÁVEIS** - Com valores específicos, prazos e prioridades

═══════════════════════════════════════════════════════════════════════════════
                        📊 CONTEXTO COMPLETO DA EMPRESA
═══════════════════════════════════════════════════════════════════════════════

**TABELA SALARIAL ATIVA:** ${activeSalaryTable ? `✅ ${activeSalaryTable.name} (Vigência: ${activeSalaryTable.effective_month}/${activeSalaryTable.effective_year})` : '⚠️ NÃO CONFIGURADA - Análise limitada'}
**TOTAL DE COLABORADORES:** ${contextData.employee_stats?.total_employees || 0}
**GRADES EM USO:** ${Object.keys(contextData.employee_stats?.grades_distribution || {}).join(', ') || 'Nenhuma'}

**💰 FAIXAS SALARIAIS POR GRADE:**
┌─────────┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ Grade   │ Mínimo       │ Q1           │ Mediana P50  │ Q3           │ Máximo       │
├─────────┼──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
${gradeRangesForPrompt || '│ (Nenhuma faixa configurada)                                              │'}
└─────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘

**👥 DADOS INDIVIDUAIS DOS COLABORADORES:**
┌────────────────────────────────────┬─────────────────────────────────────┬───────┬──────────────┬────────┬──────────────────────┬───────────────────┐
│ Nome                               │ Cargo                               │ Grade │ Salário Base │ CR%    │ Posicionamento       │ Unidade           │
├────────────────────────────────────┼─────────────────────────────────────┼───────┼──────────────┼────────┼──────────────────────┼───────────────────┤
${employeeDataForPrompt || '│ (Nenhum colaborador com salário cadastrado)                                                                                    │'}
└────────────────────────────────────┴─────────────────────────────────────┴───────┴──────────────┴────────┴──────────────────────┴───────────────────┘

**LEGENDA COMPA-RATIO (CR%):**
🔴 <80% = Abaixo do Mercado (URGENTE)
🟡 80-89% = Competitivo Inferior (ATENÇÃO)
🟢 90-110% = Alinhado ao Mercado (OK)
🔵 111-120% = Competitivo Superior (MONITORAR)
🟣 >120% = Acima do Mercado (AVALIAR)

**📈 PESQUISAS SALARIAIS DE MERCADO DISPONÍVEIS:**
${surveyDataForPrompt}

═══════════════════════════════════════════════════════════════════════════════
                          📊 DIRETRIZES DE CONFIABILIDADE
═══════════════════════════════════════════════════════════════════════════════

### 1. FONTES DE DADOS - SEMPRE INFORME:
- **[DADOS INTERNOS]:** Dados reais da empresa no CompSmart
- **[PESQUISA DE MERCADO]:** Dados de surveys/benchmarks cadastrados
- **[CÁLCULO]:** Fórmula utilizada (ex: "Compa-Ratio = Salário / Mediana × 100")
- **[ESTIMATIVA]:** Quando for projeção ou simulação

### 2. PREMISSAS NECESSÁRIAS - PERGUNTE SE FALTAR:
- **Para comparações de mercado:** Qual região/UF? Qual porte? Qual setor?
- **Para reajustes:** Qual índice de referência (INPC, IPCA)? Qual período?
- **Para análise de equidade:** Qual critério de comparação?

### 3. NUNCA INVENTAR DADOS:
- ❌ **Nunca** invente valores de mercado ou pesquisas
- ✅ Se não tiver dados: *"Não há pesquisa de mercado cadastrada para este cargo/região"*
- ✅ Sugira: "Recomendo importar dados de pesquisa salarial na seção Pesquisas"

### 4. TRANSPARÊNCIA:
- Diferencie claramente: **dados reais** da empresa vs **estimativas**
- Mostre cálculos e fórmulas utilizadas
- Indique a fonte de cada métrica apresentada

═══════════════════════════════════════════════════════════════════════════════
                          🚨 REGRAS ABSOLUTAS
═══════════════════════════════════════════════════════════════════════════════

❌ **NUNCA** peça dados ao usuário - você já tem TODOS os dados acima
❌ **NUNCA** use dados hipotéticos ou exemplos fictícios
❌ **NUNCA** escreva parágrafos longos sem tabelas ou estrutura
❌ **NUNCA** deixe de calcular métricas que você pode calcular
❌ **NUNCA** mencione ou compare dados de outras empresas clientes (confidencialidade)

✅ **SEMPRE** use os dados REAIS dos colaboradores acima
✅ **SEMPRE** use as pesquisas salariais cadastradas para benchmark de mercado
✅ **SEMPRE** calcule Compa-Ratio = (Salário / Mediana da Grade) × 100
✅ **SEMPRE** formate em tabelas profissionais
✅ **SEMPRE** priorize por urgência: 🔴 > 🟡 > 🟢
✅ **SEMPRE** inclua valores monetários específicos nos ajustes
✅ **PODE** buscar dados públicos de mercado na web para fortalecer análises ou quando solicitado

═══════════════════════════════════════════════════════════════════════════════
                          🔍 BUSCA WEB E BASE DE CONHECIMENTO
═══════════════════════════════════════════════════════════════════════════════

📚 **BASE LOCAL:** Contém resumos de adicionais de insalubridade (NR-15) e periculosidade (NR-16).
   Use para calcular impacto de adicionais legais em análises de equidade e Total Comp.

🌐 **BUSCA WEB - USE quando precisar de:**
- Valores atualizados de salário mínimo (base NR-15)
- Detalhes de anexos específicos das NRs (graus de insalubridade por agente)
- Pesquisas salariais públicas de mercado
- Práticas de remuneração por setor/indústria

═══════════════════════════════════════════════════════════════════════════════
                          📋 FORMATO DE ENTREGA
═══════════════════════════════════════════════════════════════════════════════

**ESTRUTURA OBRIGATÓRIA PARA ANÁLISE DE EQUIDADE:**

## 📊 RESUMO EXECUTIVO
[2-3 linhas com principais achados e recomendação crítica]

## 📈 ANÁLISE QUANTITATIVA

### Distribuição por Posicionamento (Compa-Ratio)
[Tabela + gráfico de barras ASCII mostrando quantos colaboradores em cada faixa]

### Colaboradores Fora da Faixa Ideal
[Tabela com: Nome | Cargo | Grade | Salário Atual | CR% | Status | Ajuste Sugerido | Novo Salário]

### Dispersão por Grade
[Tabela com: Grade | Menor Salário | Maior Salário | Dispersão% | Status]

## 🔍 DISTORÇÕES IDENTIFICADAS

### Inversões Hierárquicas
[Lista de casos onde subordinado ganha mais que gestor, se houver]

### Distorções Intra-Grade (>30%)
[Grades com dispersão salarial acima de 30%]

## 💰 PLANO DE AJUSTES

### Prioridade Alta 🔴 (Implementar em 30 dias)
[Tabela com colaboradores abaixo de 80% e inversões]

### Prioridade Média 🟡 (Implementar em 90 dias)
[Tabela com colaboradores entre 80-90%]

### Impacto Orçamentário
| Categoria        | Custo Mensal   | Custo Anual    |
|------------------|----------------|----------------|
| Prioridade Alta  | R$ X.XXX,XX    | R$ XX.XXX,XX   |
| Prioridade Média | R$ X.XXX,XX    | R$ XX.XXX,XX   |
| **TOTAL**        | **R$ X.XXX,XX**| **R$ XX.XXX,XX**|

═══════════════════════════════════════════════════════════════════════════════
                          🎯 MODO DE OPERAÇÃO: ${operationMode.toUpperCase()}
═══════════════════════════════════════════════════════════════════════════════

${operationMode === 'analise_equidade' ? `
**EXECUTAR ANÁLISE COMPLETA DE EQUIDADE INTERNA:**
1. Calcular Compa-Ratio de TODOS os colaboradores listados acima
2. Classificar cada um por posicionamento (🔴🟡🟢🔵🟣)
3. Identificar colaboradores fora da faixa ideal (<80% ou >120%)
4. Detectar inversões hierárquicas (comparar grades e salários)
5. Calcular dispersão por grade e identificar distorções >30%
6. Gerar plano de ajustes priorizado com valores específicos
7. Calcular impacto orçamentário total
` : ''}

${operationMode === 'benchmark_mercado' ? `
**EXECUTAR ANÁLISE DE COMPETITIVIDADE DE MERCADO:**
1. Comparar salários internos vs pesquisas salariais disponíveis acima
2. Calcular gap percentual por cargo/grade
3. Identificar cargos críticos (maior defasagem vs mercado)
4. Gerar ranking de competitividade
5. Recomendar ajustes para atingir P50 de mercado
6. Pode buscar dados públicos complementares na web se necessário
` : ''}

${operationMode === 'recomendacao_ajuste' || operationMode === 'compa_ratio' ? `
**GERAR RECOMENDAÇÕES ESPECÍFICAS DE AJUSTE:**
1. Listar todos colaboradores que precisam de ajuste
2. Calcular valor exato do ajuste para atingir meta (ex: CR 90%)
3. Priorizar por criticidade e impacto
4. Calcular custo total mensal e anual
5. Sugerir cronograma de implementação
` : ''}

${operationMode === 'distorcoes' ? `
**ANÁLISE DETALHADA DE DISTORÇÕES:**
1. Calcular dispersão salarial por grade
2. Identificar grades com dispersão >30%
3. Detectar inversões hierárquicas
4. Quantificar impacto financeiro das correções
5. Priorizar ações corretivas
` : ''}

${document_text ? `
═══════════════════════════════════════════════════════════════════════════════
                          📄 DOCUMENTO ANEXADO: ${document_name}
═══════════════════════════════════════════════════════════════════════════════
Analise o documento em conjunto com os dados da empresa para gerar insights.
` : ''}

**ENCERRAMENTO OBRIGATÓRIO DE CADA ANÁLISE:**

⚖️ *Esta análise é baseada em dados internos e pesquisas cadastradas. Não substitui consultoria profissional qualificada em RH, Direito ou Financeira.*

📥 **Próximos Passos Sugeridos:**
- "Deseja que eu simule um cenário de aumento de X%?"
- "Precisa de mais detalhes sobre algum colaborador específico?"
- "Posso gerar uma análise comparativa por unidade/área?"

**LEMBRE-SE:** Você está conversando com executivos. Entregue análises de qualidade AAA, com tabelas, métricas calculadas e recomendações acionáveis. NUNCA peça dados - você já os tem. AJUSTE seu vocabulário ao ramo de atividade da empresa.`;

    // ============ BUSCAR HISTÓRICO DA SESSÃO ============
    let conversationHistory: any[] = [];

    if (session_id) {
      const { data: historyData } = await supabase
        .from('salary_assistant_conversations')
        .select('question, answer')
        .eq('session_id', session_id)
        .order('created_at', { ascending: true })
        .limit(15);

      conversationHistory = historyData || [];
    }

    // Montar mensagens com histórico
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Adicionar histórico de conversação
    for (const conv of conversationHistory) {
      messages.push({ role: 'user', content: conv.question });
      messages.push({ role: 'assistant', content: conv.answer });
    }

    // Adicionar pergunta atual
    messages.push({ 
      role: 'user', 
      content: question + (document_text ? `\n\n---DOCUMENTO ANEXADO---\n${document_text}` : '') 
    });

    const startTime = Date.now();

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5.4',
        messages,
        max_tokens: 8000,
        stream: true,
      }),
    });

    if (!aiResponse.ok || !aiResponse.body) {
      const errorText = await aiResponse.text().catch(() => '');
      console.error('Lovable AI error:', aiResponse.status, errorText);
      const msg = aiResponse.status === 429
        ? 'Limite de requisições excedido. Tente novamente em alguns segundos.'
        : aiResponse.status === 402
          ? 'Créditos de IA esgotados. Adicione créditos ao workspace.'
          : `Erro ao processar com IA (${aiResponse.status})`;
      return new Response(JSON.stringify({ error: msg }), {
        status: aiResponse.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const encoder = new TextEncoder();
    const upstream = aiResponse.body;

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: any) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        let fullAnswer = '';
        let tokensUsed = 0;

        try {
          const reader = upstream.getReader();
          const decoder = new TextDecoder();
          let buf = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            let nl: number;
            while ((nl = buf.indexOf('\n')) !== -1) {
              const line = buf.slice(0, nl).trim();
              buf = buf.slice(nl + 1);
              if (!line.startsWith('data:')) continue;
              const payload = line.slice(5).trim();
              if (payload === '[DONE]') continue;
              try {
                const j = JSON.parse(payload);
                const delta = j.choices?.[0]?.delta?.content;
                if (delta) {
                  fullAnswer += delta;
                  send('delta', { text: delta });
                }
                if (j.usage?.total_tokens) tokensUsed = j.usage.total_tokens;
              } catch { /* ignore */ }
            }
          }

          if (!fullAnswer) fullAnswer = 'Desculpe, não consegui gerar uma resposta.';

          const responseTime = Date.now() - startTime;
          const extractedSources = extractSalarySources(fullAnswer);
          const conversationId = crypto.randomUUID();

          await supabase.from('salary_assistant_conversations').insert({
            id: conversationId,
            user_id: user.id,
            session_id: session_id || null,
            question,
            answer: fullAnswer,
            context_data: contextData,
            document_name: document_name || null,
            operation_mode: operationMode,
            tokens_used: tokensUsed,
            response_time_ms: responseTime,
          });

          if (extractedSources.length > 0) {
            const sourcesToInsert = extractedSources.map(source => ({
              conversation_id: conversationId,
              agent_type: 'salary',
              source_type: source.source_type,
              source_reference: source.source_reference,
              source_category: source.source_category,
              citation_context: source.citation_context.substring(0, 500),
              verified: false,
            }));
            const { error: citationError } = await supabase
              .from('agent_source_citations')
              .insert(sourcesToInsert);
            if (citationError) console.error('Error saving source citations:', citationError);
            else console.log(`✅ Salvas ${sourcesToInsert.length} citações de fontes salariais para auditoria`);
          }

          console.log(`✅ Salary Smart processed for ${profile.email} (${tokensUsed} tokens, ${responseTime}ms, industry: ${industrySector})`);

          send('done', {
            answer: fullAnswer,
            operation_mode: operationMode,
            tokens_used: tokensUsed,
            response_time_ms: responseTime,
            conversation_id: conversationId,
            context_summary: {
              has_salary_table: !!activeSalaryTable,
              has_survey_data: !!surveyTables?.length,
              employee_count: contextData.employee_stats?.total_employees || 0,
              knowledge_docs: knowledgeDocs?.length || 0,
              industry_sector: industrySector,
            },
          });
        } catch (err) {
          console.error('Stream error:', err);
          send('error', { error: (err as Error).message || 'Erro no streaming' });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
        Connection: 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('❌ Salary Smart error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao processar consulta' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Função auxiliar para determinar vocabulário por ramo de atividade
function getVocabularyGuide(industrySector: string): string {
  const sector = industrySector?.toLowerCase() || '';
  
  if (sector.includes('tecnologia') || sector.includes('ti') || sector.includes('software')) {
    return `**Ramo TI/Tecnologia detectado** - Use termos técnicos como: stack, sprint, deploy, SRE, DevOps, tech lead, squad, tribe, chapter, agile, scrum master, product owner, backend, frontend, fullstack, cloud engineer, arquiteto de software.`;
  }
  
  if (sector.includes('marketing') || sector.includes('publicidade') || sector.includes('propaganda')) {
    return `**Ramo Marketing/Publicidade detectado** - Use termos criativos como: briefing, branding, ROI de campanha, awareness, engajamento, mídia performance, lead generation, copywriter, diretor de arte, planner, atendimento, ROAS, CAC, LTV.`;
  }
  
  if (sector.includes('financeiro') || sector.includes('bancário') || sector.includes('banco') || sector.includes('investimento')) {
    return `**Ramo Financeiro/Bancário detectado** - Use termos formais como: compliance, hedge, due diligence, asset management, wealth management, private banking, corporate banking, tesouraria, controladoria, auditoria, gestão de risco, regulatório.`;
  }
  
  if (sector.includes('varejo') || sector.includes('comércio') || sector.includes('retail')) {
    return `**Ramo Varejo/Comércio detectado** - Use termos acessíveis como: PDV, giro de estoque, ruptura, sell-in, sell-out, ticket médio, conversão, visual merchandising, gerente de loja, operador de caixa, repositor, buyer.`;
  }
  
  if (sector.includes('indústria') || sector.includes('manufatura') || sector.includes('fábrica')) {
    return `**Ramo Indústria/Manufatura detectado** - Use termos operacionais como: OEE, setup, turno, linha de produção, lean manufacturing, qualidade total, manutenção preventiva, engenharia de processos, PCP, supervisor de produção, operador de máquinas.`;
  }
  
  if (sector.includes('saúde') || sector.includes('hospitalar') || sector.includes('clínica')) {
    return `**Ramo Saúde/Hospitalar detectado** - Use termos específicos como: corpo clínico, plantão, procedimento, prontuário, enfermagem, coordenação médica, gestão hospitalar, hotelaria hospitalar, OPME, farmácia clínica, UTI, centro cirúrgico.`;
  }
  
  if (sector.includes('educação') || sector.includes('ensino') || sector.includes('escola')) {
    return `**Ramo Educação detectado** - Use termos educacionais como: corpo docente, coordenação pedagógica, grade curricular, carga horária, titulação, dedicação exclusiva, extensão, pesquisa, pós-graduação, secretaria acadêmica.`;
  }
  
  if (sector.includes('logística') || sector.includes('transporte') || sector.includes('supply')) {
    return `**Ramo Logística/Transportes detectado** - Use termos operacionais como: supply chain, last mile, cross-docking, centro de distribuição, frota, roteirização, picking, packing, WMS, TMS, operador logístico.`;
  }
  
  if (sector.includes('construção') || sector.includes('civil') || sector.includes('engenharia')) {
    return `**Ramo Construção Civil detectado** - Use termos de obra como: canteiro, empreiteiro, incorporação, BDI, cronograma físico-financeiro, mestre de obras, engenheiro residente, orçamentista, topografia, fundações.`;
  }
  
  if (sector.includes('agro') || sector.includes('agrícola') || sector.includes('agronegócio')) {
    return `**Ramo Agronegócio detectado** - Use termos rurais como: safra, entressafra, commodity, silo, armazém, manejo, fertilizante, defensivo, agrônomo, operador de máquinas agrícolas, supervisor de campo.`;
  }
  
  if (sector.includes('energia') || sector.includes('utilities') || sector.includes('elétrica')) {
    return `**Ramo Energia/Utilities detectado** - Use termos do setor como: geração, transmissão, distribuição, subestação, manutenção de redes, eletricista, engenheiro eletricista, regulação ANEEL, mercado livre, comercializadora.`;
  }
  
  if (sector.includes('serviços') || sector.includes('consultoria')) {
    return `**Ramo Serviços Profissionais detectado** - Use termos corporativos como: projeto, entrega, alocação, utilização, billing, partner, associate, consultant, manager, senior manager, director, engagement.`;
  }
  
  return `**Ramo não especificado** - Use vocabulário corporativo padrão, claro e profissional. Adapte conforme o contexto das perguntas do usuário.`;
}
