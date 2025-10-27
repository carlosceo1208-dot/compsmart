import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { jobTitle, grade, area, existingCompetencies } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const systemPrompt = `Você é um especialista em Recursos Humanos e Gestão por Competências.
Sua tarefa é sugerir competências técnicas (hard skills) e comportamentais (soft skills) para cargos.

IMPORTANTE:
- Sugira NO MÍNIMO 3 hard skills e 3 soft skills
- Máximo de 5 de cada tipo
- Seja específico e relevante para o cargo
- Considere o nível hierárquico (grade/nível)
- Evite competências genéricas demais
- Para cada competência, indique o nível esperado: basic, intermediate, advanced, expert

Retorne APENAS um JSON válido sem formatação Markdown, seguindo esta estrutura:
{
  "hard_skills": [
    {
      "name": "Nome da competência técnica",
      "description": "Breve descrição (1 linha)",
      "suggested_level": "intermediate"
    }
  ],
  "soft_skills": [
    {
      "name": "Nome da competência comportamental",
      "description": "Breve descrição (1 linha)",
      "suggested_level": "advanced"
    }
  ]
}`;

    const userPrompt = `Sugira competências para o cargo:

Cargo: ${jobTitle}
Nível/Grade: ${grade}
${area ? `Área: ${area}` : ''}

${existingCompetencies && existingCompetencies.length > 0 
  ? `Competências já cadastradas (evite duplicar): ${existingCompetencies.map((c: any) => c.name).join(', ')}`
  : ''
}

Responda APENAS com o JSON, sem texto adicional.`;

    console.log('Calling AI gateway for job competencies suggestion...');

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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições atingido. Tente novamente em alguns instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos Lovable AI esgotados. Adicione créditos ao workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;
    
    if (!aiContent) {
      throw new Error('Resposta vazia da IA');
    }

    console.log('AI response received:', aiContent.substring(0, 200));

    // Parse do JSON retornado pela IA
    let suggestions;
    try {
      const cleanedContent = aiContent.replace(/```json\n?|\n?```/g, '').trim();
      suggestions = JSON.parse(cleanedContent);
    } catch (e) {
      console.error('Erro ao parsear resposta da IA:', aiContent);
      throw new Error('Formato de resposta inválido da IA');
    }

    if (!suggestions.hard_skills || !suggestions.soft_skills) {
      throw new Error('Resposta da IA sem competências esperadas');
    }

    console.log('Successfully generated suggestions:', {
      hardSkills: suggestions.hard_skills.length,
      softSkills: suggestions.soft_skills.length
    });

    return new Response(
      JSON.stringify(suggestions),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro em suggest-job-competencies:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
