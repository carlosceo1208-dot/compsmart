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
    // ============ AUTENTICAÇÃO OBRIGATÓRIA ============
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Autorização necessária' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============ RATE LIMITING (20/hora - geração é mais cara) ============
    const { data: allowed } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_function_name: 'generate-job-description',
      p_max_requests: 20,
      p_window_minutes: 60
    });

    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Limite de gerações excedido. Aguarde alguns minutos.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { jobTitle, grade, cbo, jobFamily, mode = 'full', summary, mainResponsibilities } = await req.json();
    
    // Validação de inputs
    if (!jobTitle || typeof jobTitle !== 'string' || jobTitle.length > 200) {
      return new Response(
        JSON.stringify({ error: 'jobTitle inválido (máx 200 caracteres)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!grade) {
      return new Response(
        JSON.stringify({ error: 'grade é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (mode === 'hay_evaluation') {
      // EVALUATION MODE - Metodologia de avaliação de cargos por pontos
      systemPrompt = `Você é um especialista certificado em avaliação de cargos por pontos (metodologia de pontuação de fatores).
Você conhece profundamente os 3 fatores da metodologia:
1. KNOW-HOW: Técnico/Profissional (A-H), Gerencial (I-IV), Relações Humanas (1-3)
2. SOLUÇÃO DE PROBLEMAS: Ambiente de Pensamento (A-H), Desafio (10%-33%)
3. RESPONSABILIDADE: Liberdade de Ação (A-H), Magnitude (1-4), Impacto (R, C, S, P)

IMPORTANTE: Você DEVE calcular e retornar um valor numérico válido para total_points.

Referência de pontos por grade:
- Grades 1-2: 100-150 pontos (cargos operacionais básicos)
- Grades 3-4: 151-230 pontos (cargos técnicos juniores)
- Grades 5-6: 231-350 pontos (cargos técnicos plenos)
- Grades 7-8: 351-500 pontos (cargos seniores/especialistas)
- Grades 9-10: 501-700 pontos (cargos de coordenação/gestão)
- Grades 11+: 701-1000+ pontos (cargos executivos)

Você deve avaliar cargos de forma consistente e fundamentada, sempre justificando suas escolhas.
Lembre-se: esta é uma SUGESTÃO INICIAL. O RH poderá ajustar os valores conforme a realidade da empresa.
Sempre retorne um JSON válido com TODOS os campos preenchidos.`;

      // Parse grade number para referência
      const gradeNum = parseInt(grade) || 5;
      let pointsRange = '231-350';
      let minPoints = 231;
      let maxPoints = 350;
      
      if (gradeNum <= 2) { pointsRange = '100-150'; minPoints = 100; maxPoints = 150; }
      else if (gradeNum <= 4) { pointsRange = '151-230'; minPoints = 151; maxPoints = 230; }
      else if (gradeNum <= 6) { pointsRange = '231-350'; minPoints = 231; maxPoints = 350; }
      else if (gradeNum <= 8) { pointsRange = '351-500'; minPoints = 351; maxPoints = 500; }
      else if (gradeNum <= 10) { pointsRange = '501-700'; minPoints = 501; maxPoints = 700; }
      else { pointsRange = '701-1000'; minPoints = 701; maxPoints = 1000; }

      userPrompt = `Avalie o cargo abaixo conforme a metodologia de avaliação por pontos:

**CARGO:**
- Título: ${jobTitle}
- Grade Atual: ${grade}
- Família: ${jobFamily || 'Não informada'}
${summary ? `- Sumário: ${summary}` : ''}
${mainResponsibilities ? `- Responsabilidades: ${mainResponsibilities}` : ''}

**INSTRUÇÕES:**
1. Avalie cada fator considerando o nível de complexidade do cargo
2. IMPORTANTE: O total_points DEVE estar na faixa ${pointsRange} para um cargo de grade ${grade}
3. Use um valor entre ${minPoints} e ${maxPoints} pontos
4. Sugira o perfil do cargo (A=Administrativo, C=Coordenação, P=Pensamento, T=Técnico)
5. Forneça uma justificativa clara para a avaliação

**VALORES VÁLIDOS PARA CADA FATOR:**
- knowhow_technical: A, B, C, D, E, F, G ou H
- knowhow_managerial: I, II, III ou IV
- knowhow_human_relations: 1, 2 ou 3
- problem_environment: A, B, C, D, E, F, G ou H
- problem_challenge: 10%, 14%, 19%, 25% ou 33%
- accountability_freedom: A, B, C, D, E, F, G ou H
- accountability_magnitude: 1, 2, 3 ou 4
- accountability_impact: R, C, S ou P
- profile: A, C, P ou T

**RETORNE JSON:**
{
  "knowhow_technical": "X",
  "knowhow_managerial": "XX",
  "knowhow_human_relations": "X",
  "problem_environment": "X",
  "problem_challenge": "XX%",
  "accountability_freedom": "X",
  "accountability_magnitude": "X",
  "accountability_impact": "X",
  "total_points": ${Math.floor((minPoints + maxPoints) / 2)},
  "suggested_grade": "${grade}",
  "profile": "X",
  "evaluation_notes": "Justificativa detalhada da avaliação explicando as escolhas para cada fator..."
}

IMPORTANTE: O campo total_points DEVE ser um número inteiro entre ${minPoints} e ${maxPoints}. NUNCA retorne 0 ou null.`;

    } else {
      // EXISTING MODES (summary, full)
      systemPrompt = `Você é um especialista em RH e estruturação de cargos no Brasil.
Gere descrições profissionais e objetivas baseadas nas melhores práticas de mercado.
Você conhece profundamente a Classificação Brasileira de Ocupações (CBO) e sabe identificar o código mais adequado para cada cargo.
Sempre retorne um JSON válido com as chaves solicitadas.`;

      // Instrução sobre CBO
      const cboInstruction = cbo 
        ? `- CBO informado: ${cbo}` 
        : `- CBO: NÃO INFORMADO - você DEVE sugerir o código CBO mais adequado baseado no título, família e nível do cargo`;
      
      if (mode === 'summary') {
        userPrompt = `Gere um sumário executivo para o cargo:
- Título: ${jobTitle}
- Família: ${jobFamily || 'Não informada'}
- Grade: ${grade}
${cboInstruction}

Retorne JSON com:
{
  ${!cbo ? `"suggested_cbo": "XXXX-XX",
  "cbo_title": "Nome oficial da ocupação conforme CBO",
  "cbo_reasoning": "Breve justificativa (1-2 frases) explicando a escolha do CBO",` : ''}
  "summary": "2-3 frases descrevendo o propósito e escopo do cargo"
}`;
      } else {
        userPrompt = `Gere a descrição completa para o cargo:
- Título: ${jobTitle}
- Família: ${jobFamily || 'Não informada'}
- Grade: ${grade}
${cboInstruction}

Retorne JSON com:
{
  ${!cbo ? `"suggested_cbo": "XXXX-XX",
  "cbo_title": "Nome oficial da ocupação conforme CBO",
  "cbo_reasoning": "Breve justificativa (1-2 frases) explicando a escolha do CBO",` : ''}
  "summary": "2-3 frases executivas",
  "main_responsibilities": "Lista de 5-7 responsabilidades principais (separadas por quebra de linha)",
  "key_factors": "Competências críticas e fatores determinantes",
  "job_impact": "Impacto organizacional e contribuição esperada",
  "soft_skills": ["Soft skill 1", "Soft skill 2", "Soft skill 3", "Soft skill 4", "Soft skill 5"],
  "hard_skills": ["Hard skill 1", "Hard skill 2", "Hard skill 3", "Hard skill 4", "Hard skill 5"],
  "required_experience": "Anos e tipo de experiência necessária",
  "required_education": "Formação acadêmica mínima requerida"
}`;
      }
    }

    console.log('Calling AI gateway with mode:', mode);
    console.log('User prompt:', userPrompt.substring(0, 500) + '...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições atingido. Tente novamente em alguns segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione fundos no workspace Lovable.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Erro ao comunicar com o gateway de IA');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Resposta vazia do modelo de IA');
    }

    console.log('AI response:', content.substring(0, 500) + '...');

    // Parse JSON response
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Resposta da IA não está em formato JSON válido');
    }

    // Validate total_points for hay_evaluation mode
    if (mode === 'hay_evaluation') {
      if (!parsedContent.total_points || parsedContent.total_points === 0) {
        // Calculate a reasonable default based on grade
        const gradeNum = parseInt(grade) || 5;
        if (gradeNum <= 2) parsedContent.total_points = 125;
        else if (gradeNum <= 4) parsedContent.total_points = 190;
        else if (gradeNum <= 6) parsedContent.total_points = 290;
        else if (gradeNum <= 8) parsedContent.total_points = 425;
        else if (gradeNum <= 10) parsedContent.total_points = 600;
        else parsedContent.total_points = 850;
        
        console.log('total_points was missing or zero, set default:', parsedContent.total_points);
      }
    }

    return new Response(
      JSON.stringify(parsedContent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in generate-job-description:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao gerar descrição' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
