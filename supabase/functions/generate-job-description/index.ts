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
    const { jobTitle, grade, cbo, jobFamily, mode = 'full' } = await req.json();
    
    if (!jobTitle || !grade || !cbo) {
      return new Response(
        JSON.stringify({ error: 'jobTitle, grade e cbo são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    // Build prompt based on mode
    const systemPrompt = `Você é um especialista em RH e estruturação de cargos no Brasil.
Gere descrições profissionais e objetivas baseadas nas melhores práticas de mercado.
Sempre retorne um JSON válido com as chaves solicitadas.`;

    let userPrompt = '';
    
    if (mode === 'summary') {
      userPrompt = `Gere um sumário executivo para o cargo:
- Título: ${jobTitle}
- Família: ${jobFamily}
- Grade: ${grade}
- CBO: ${cbo}

Retorne JSON com:
{
  "summary": "2-3 frases descrevendo o propósito e escopo do cargo"
}`;
    } else {
      userPrompt = `Gere a descrição completa para o cargo:
- Título: ${jobTitle}
- Família: ${jobFamily}
- Grade: ${grade}
- CBO: ${cbo}

Retorne JSON com:
{
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