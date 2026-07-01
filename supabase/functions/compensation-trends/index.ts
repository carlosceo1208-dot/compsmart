import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Authentication: require valid JWT ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Rate limiting: 10 requests/user/hour via database ---
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: allowed } = await serviceClient.rpc("check_rate_limit", {
      p_user_id: user.id,
      p_function_name: "compensation-trends",
      p_max_requests: 10,
      p_window_minutes: 60,
    });

    if (!allowed) {
      // Return fallback content with 200 so the UI keeps working; signal via `fallback`.
      return new Response(JSON.stringify({ ...FALLBACK_TRENDS, fallback: true, reason: "rate_limited" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- AI call ---
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
        model: "google/gemini-3.1-flash-lite-preview",
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
      console.error("AI gateway error:", response.status);
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

    // Parse the JSON response
    let trends;
    try {
      let cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const jsonStart = cleanContent.indexOf('{');
      const jsonEnd = cleanContent.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
      }
      trends = JSON.parse(cleanContent);
    } catch (_parseError) {
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
    console.error("compensation-trends error:", error instanceof Error ? error.message : "Unknown error");
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
