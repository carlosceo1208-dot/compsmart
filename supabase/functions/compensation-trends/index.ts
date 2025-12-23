import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um especialista em remuneração no Brasil.
Gere 5 tendências de remuneração para 2025/2026.

Retorne APENAS JSON válido neste formato (sem markdown):
{
  "trends": [
    {
      "title": "Título curto (max 40 chars)",
      "summary": "Resumo em 1 frase curta",
      "source": "Fonte (ex: Robert Half)",
      "category": "salários",
      "detailed_analysis": "Análise em 1 parágrafo curto",
      "impact": "Impacto em 1 frase",
      "recommendations": ["Rec 1", "Rec 2"],
      "search_terms": ["termo 1", "termo 2"]
    }
  ]
}

Categorias: salários, benefícios, trabalho_remoto, tecnologia, liderança
IMPORTANTE: Seja CONCISO. Cada campo deve ser breve.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Gere 5 tendências de remuneração concisas para o Brasil 2025/2026." }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("AI response length:", content.length);

    // Parse the JSON response
    let trends;
    try {
      // Remove markdown code blocks if present
      let cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Try to find valid JSON object
      const jsonStart = cleanContent.indexOf('{');
      const jsonEnd = cleanContent.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
      }
      
      trends = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content.substring(0, 500));
      
      // Return fallback trends if parsing fails
      trends = {
        trends: [
          {
            title: "Remuneração baseada em habilidades",
            summary: "Foco em competências específicas ao invés de cargos tradicionais",
            source: "Robert Half",
            category: "salários",
            detailed_analysis: "Empresas estão valorizando habilidades técnicas e comportamentais específicas.",
            impact: "Maior competitividade na atração de talentos",
            recommendations: ["Mapear habilidades críticas", "Criar trilhas de desenvolvimento"],
            search_terms: ["skills-based pay Brasil", "remuneração por competências"]
          },
          {
            title: "Benefícios flexíveis",
            summary: "Pacotes personalizados conforme necessidades individuais",
            source: "Michael Page",
            category: "benefícios",
            detailed_analysis: "Colaboradores podem escolher benefícios que façam sentido para seu momento de vida.",
            impact: "Aumento no engajamento e satisfação",
            recommendations: ["Implementar plataforma de benefícios flexíveis", "Pesquisar preferências"],
            search_terms: ["benefícios flexíveis 2025", "flex benefits Brasil"]
          },
          {
            title: "Transparência salarial",
            summary: "Maior abertura sobre faixas e critérios de remuneração",
            source: "Korn Ferry",
            category: "salários",
            detailed_analysis: "Tendência global de divulgar faixas salariais em vagas e internamente.",
            impact: "Redução de desigualdades e maior confiança",
            recommendations: ["Revisar estrutura de cargos", "Comunicar política salarial"],
            search_terms: ["transparência salarial Brasil", "pay transparency"]
          },
          {
            title: "Trabalho híbrido estruturado",
            summary: "Políticas claras para modelos flexíveis de trabalho",
            source: "Hays",
            category: "trabalho_remoto",
            detailed_analysis: "Empresas definindo regras claras para dias presenciais e remotos.",
            impact: "Equilíbrio entre colaboração e flexibilidade",
            recommendations: ["Definir política híbrida clara", "Ajustar benefícios para home office"],
            search_terms: ["trabalho híbrido 2025", "política home office"]
          },
          {
            title: "Incentivos de longo prazo",
            summary: "Programas de ILP para retenção de talentos-chave",
            source: "Mercer",
            category: "liderança",
            detailed_analysis: "Stock options e RSUs ganham força além das startups tradicionais.",
            impact: "Maior retenção de profissionais estratégicos",
            recommendations: ["Avaliar programas de ILP", "Comunicar valor total da remuneração"],
            search_terms: ["ILP Brasil 2025", "stock options empresas brasileiras"]
          }
        ]
      };
    }

    return new Response(JSON.stringify(trends), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("compensation-trends error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
