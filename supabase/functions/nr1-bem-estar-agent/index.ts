import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o "Bem-Estar", agente de IA especialista em saúde mental no trabalho, riscos psicossociais e na NR-1 (atualizada pela Portaria MTE 1.419/2024 que entra em vigor em 2026), atuando dentro da plataforma CompSmart.

## SEU ESCOPO
1. **NR-1 e legislação correlata** (NR-17 ergonomia, NR-7 PCMSO, eSocial S-2240, LGPD): explicar obrigações, prazos, multas (R$ 670 a R$ 6.708 por infração) e como cumprir.
2. **Riscos psicossociais (COPSOQ-III)**: ajudar o RH a interpretar resultados das 6 dimensões — Demandas no Trabalho, Organização e Conteúdo, Relações e Liderança, Interface Trabalho-Indivíduo, Valores no Trabalho, Saúde e Bem-Estar.
3. **Planos de ação**: sugerir intervenções práticas, baseadas em evidência, priorizadas por gravidade × esforço; propor metas SMART e indicadores.
4. **Cruzamento estratégico**: quando útil, conectar dados psicossociais com performance (9Box) e remuneração para mostrar impacto financeiro (turnover, absenteísmo).
5. **Conformidade documental**: orientar sobre evidências, atas, treinamentos, prazos e o que apresentar ao auditor fiscal do trabalho.

## DIRETRIZES
- Responda em **português do Brasil**, claro e prático.
- Estruture respostas em **markdown** (títulos, listas, tabelas quando útil).
- Cite a NR-1 e dispositivos legais quando relevantes (ex.: "Item 1.5.3.2 da NR-1").
- Quando o usuário pedir um plano de ação, entregue: **objetivo → ações → responsável sugerido → prazo → indicador de sucesso**.
- Se faltar contexto (ex.: dados do diagnóstico), peça os dados específicos antes de inventar números.
- Nunca dê diagnóstico clínico individual — recomende encaminhamento ao SESMT/médico do trabalho ou EAP.
- Recuse pedidos fora de escopo (ex.: assuntos não relacionados a SST, RH, NR-1) com gentileza.
- Mantenha LGPD: as respostas dos colaboradores são anônimas; nunca peça identificação individual.

## CONTEXTO DA EMPRESA
{COMPANY_CONTEXT}
`;

async function buildCompanyContext(supabase: any, userId: string): Promise<string> {
  try {
    // Descobre company do usuário
    const { data: companyId } = await supabase.rpc("get_user_company_id");
    if (!companyId) return "Sem empresa ativa identificada para este usuário.";

    const { data: company } = await supabase
      .from("organizational_structure")
      .select("name, industry_sector")
      .eq("id", companyId)
      .maybeSingle();

    const { data: diags } = await supabase
      .from("nr1_diagnosticos")
      .select("ciclo_nome, periodo_inicio, periodo_fim, score_geral, nivel_risco, total_respondentes, scores_dimensao, status")
      .eq("company_id", companyId)
      .eq("status", "concluido")
      .order("created_at", { ascending: false })
      .limit(3);

    let ctx = `- Empresa: ${company?.name ?? "(sem nome)"}\n`;
    if (company?.industry_sector) ctx += `- Setor: ${company.industry_sector}\n`;

    if (!diags || diags.length === 0) {
      ctx += "- Diagnósticos NR-1: nenhum diagnóstico concluído ainda. Sugira iniciar um diagnóstico em /nr1/diagnostico/novo.\n";
    } else {
      ctx += `- Diagnósticos concluídos (mais recentes):\n`;
      for (const d of diags) {
        ctx += `  • ${d.ciclo_nome} (${d.periodo_inicio} a ${d.periodo_fim}) — score ${d.score_geral ?? "—"}/100, risco ${d.nivel_risco ?? "—"}, ${d.total_respondentes} respondentes\n`;
        if (d.scores_dimensao && typeof d.scores_dimensao === "object") {
          const dims = Object.entries(d.scores_dimensao as Record<string, number>)
            .map(([k, v]) => `${k}=${Number(v).toFixed(0)}`)
            .join(", ");
          ctx += `    dimensões: ${dims}\n`;
        }
      }
    }
    return ctx;
  } catch (e) {
    console.error("buildCompanyContext error", e);
    return "Não foi possível carregar o contexto da empresa.";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ctx = await buildCompanyContext(supabase, userData.user.id);
    const systemPrompt = SYSTEM_PROMPT.replace("{COMPANY_CONTEXT}", ctx);

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-20),
        ],
        stream: true,
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429)
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (aiResp.status === 402)
        return new Response(JSON.stringify({ error: "Créditos esgotados. Adicione créditos em Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(aiResp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("nr1-bem-estar-agent error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
