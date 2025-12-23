import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobTitle, grade, cbo, jobFamily, mode = 'full', summary, mainResponsibilities } = await req.json();
    
    // CBO agora é opcional - IA vai sugerir se não fornecido
    if (!jobTitle || !grade) {
      return new Response(
        JSON.stringify({ error: 'jobTitle e grade são obrigatórios' }),
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
      // HAY EVALUATION MODE
      systemPrompt = `Você é um especialista certificado em avaliação de cargos pela metodologia Hay (Korn Ferry).
Você conhece profundamente os 3 fatores da metodologia:
1. KNOW-HOW: Técnico/Profissional (A-H), Gerencial (I-IV), Relações Humanas (1-3)
2. PROBLEM SOLVING: Ambiente de Pensamento (A-H), Desafio (10%-33%)
3. ACCOUNTABILITY: Liberdade de Ação (A-H), Magnitude (1-4), Impacto (R, C, S, P)

Você deve avaliar cargos de forma consistente e fundamentada, sempre justificando suas escolhas.
Lembre-se: esta é uma SUGESTÃO INICIAL. O RH poderá ajustar os valores conforme a realidade da empresa.
Sempre retorne um JSON válido.`;

      userPrompt = `Avalie o cargo abaixo conforme a metodologia Hay:

**CARGO:**
- Título: ${jobTitle}
- Grade Atual: ${grade}
- Família: ${jobFamily || 'Não informada'}
${summary ? `- Sumário: ${summary}` : ''}
${mainResponsibilities ? `- Responsabilidades: ${mainResponsibilities}` : ''}

**INSTRUÇÕES:**
1. Avalie cada fator Hay considerando o nível de complexidade do cargo
2. Calcule os pontos totais (valores típicos: 100-1000+)
3. Sugira o perfil do cargo (A=Administrativo, C=Coordenação, P=Pensamento, T=Técnico)
4. Forneça uma justificativa clara para a avaliação

**RETORNE JSON:**
{
  "knowhow_technical": "X",
  "knowhow_managerial": "X",
  "knowhow_human_relations": "X",
  "problem_environment": "X",
  "problem_challenge": "XX%",
  "accountability_freedom": "X",
  "accountability_magnitude": "X",
  "accountability_impact": "X",
  "total_points": 000,
  "suggested_grade": "X",
  "profile": "X",
  "evaluation_notes": "Justificativa detalhada da avaliação explicando as escolhas para cada fator..."
}`;

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

    // Parse JSON response
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Resposta da IA não está em formato JSON válido');
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