import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Identify user
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Tenant + role check
    const { data: profile } = await supabase
      .from("profiles")
      .select("root_company_id")
      .eq("id", userId)
      .single();

    const companyId = profile?.root_company_id;
    if (!companyId) {
      return new Response(JSON.stringify({ error: "Company not found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const allowed = roles?.some((r: any) =>
      ["admin", "hr_manager"].includes(r.role)
    );
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { jobTitleId } = await req.json();
    if (!jobTitleId || typeof jobTitleId !== "string") {
      return new Response(JSON.stringify({ error: "jobTitleId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load job title (tenant-scoped)
    const { data: job, error: jobErr } = await supabase
      .from("job_titles")
      .select(
        "id, title, code, cbo, grade, job_family, summary, main_responsibilities, required_education, required_experience, hard_skills, soft_skills, root_company_id"
      )
      .eq("id", jobTitleId)
      .eq("root_company_id", companyId)
      .single();

    if (jobErr || !job) {
      return new Response(JSON.stringify({ error: "Job title not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pull active survey market data for this company
    const { data: marketRows } = await supabase
      .from("survey_data")
      .select("role_title, cbo_code, median_value, q1_value, q3_value")
      .eq("root_company_id", companyId)
      .limit(200);

    const marketCatalog = (marketRows ?? [])
      .map(
        (r: any) =>
          `- ${r.role_title}${r.cbo_code ? " (CBO " + r.cbo_code + ")" : ""} | mediana R$ ${r.median_value}`
      )
      .join("\n");

    const systemPrompt = `Você é um especialista em remuneração e job matching. Analise o cargo interno e identifique o cargo de mercado mais equivalente entre as opções fornecidas. Retorne SEMPRE via tool call.`;

    const userPrompt = `CARGO INTERNO:
Título: ${job.title}
Código: ${job.code}
CBO: ${job.cbo}
Grade: ${job.grade}
Família: ${job.job_family}
Resumo: ${job.summary ?? "-"}
Responsabilidades: ${job.main_responsibilities ?? "-"}
Formação: ${job.required_education ?? "-"}
Experiência: ${job.required_experience ?? "-"}
Hard skills: ${job.hard_skills ?? "-"}
Soft skills: ${job.soft_skills ?? "-"}

CATÁLOGO DE MERCADO DISPONÍVEL:
${marketCatalog || "(vazio — sugira o melhor match genérico)"}

Retorne o melhor match com score (0-100), justificativa, e recomendações de ação.`;

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "submit_match",
                description: "Submit job matching analysis",
                parameters: {
                  type: "object",
                  properties: {
                    matched_market_role: { type: "string" },
                    matched_cbo_code: { type: "string" },
                    match_score: { type: "number" },
                    reasoning: { type: "string" },
                    recommendations: { type: "string" },
                    market_median: { type: "number" },
                  },
                  required: [
                    "matched_market_role",
                    "match_score",
                    "reasoning",
                    "recommendations",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "submit_match" },
          },
        }),
      }
    );

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos da IA esgotados. Adicione fundos no workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await aiResp.text();
      console.error("AI error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No tool call returned" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const args = JSON.parse(toolCall.function.arguments);

    // Compute internal median from current employees in this job title
    const { data: emps } = await supabase
      .from("profiles")
      .select("salary")
      .eq("root_company_id", companyId)
      .eq("job_title_id", jobTitleId)
      .gt("salary", 0);

    const salaries = (emps ?? [])
      .map((e: any) => Number(e.salary))
      .sort((a, b) => a - b);
    let internalMedian: number | null = null;
    if (salaries.length) {
      const mid = Math.floor(salaries.length / 2);
      internalMedian =
        salaries.length % 2 === 0
          ? (salaries[mid - 1] + salaries[mid]) / 2
          : salaries[mid];
    }

    const marketMedian =
      typeof args.market_median === "number" ? args.market_median : null;
    const gapPct =
      internalMedian && marketMedian
        ? Number(
            (((internalMedian - marketMedian) / marketMedian) * 100).toFixed(2)
          )
        : null;

    // Upsert via delete-then-insert (one match per job_title)
    await supabase
      .from("job_matching_results")
      .delete()
      .eq("job_title_id", jobTitleId)
      .eq("root_company_id", companyId);

    const { data: inserted, error: insErr } = await supabase
      .from("job_matching_results")
      .insert({
        root_company_id: companyId,
        job_title_id: jobTitleId,
        matched_market_role: args.matched_market_role,
        matched_cbo_code: args.matched_cbo_code ?? null,
        match_score: Math.max(0, Math.min(100, Number(args.match_score))),
        reasoning: args.reasoning,
        recommendations: args.recommendations,
        market_median: marketMedian,
        internal_median: internalMedian,
        gap_pct: gapPct,
        created_by: userId,
      })
      .select()
      .single();

    if (insErr) {
      console.error("Insert error:", insErr);
      return new Response(JSON.stringify({ error: insErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, match: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Function error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
