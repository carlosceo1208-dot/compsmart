import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GRAU_LABEL: Record<number, string> = {
  1: "Risco Leve (1)",
  2: "Risco Médio (2)",
  3: "Risco Grave (3)",
  4: "Risco Gravíssimo (4)",
};

const SYSTEM_PROMPT = `Você é o "Bem-Estar IA — Assistente do Plano de Ação NR-1" da plataforma CompSmart.
Sua missão: propor, priorizar e revisar AÇÕES concretas do plano de ação NR-1 com base em:
- Diagnóstico psicossocial mais recente (COPSOQ-III, 6 dimensões)
- Grau de risco INSS (CNAE) da empresa, que define exigências mínimas
- Ações já cadastradas (status, prazo, prioridade, progresso)

REGRAS OBRIGATÓRIAS:
1. SEMPRE responda chamando a ferramenta "propose_actions". NUNCA responda em texto livre.
2. Cada ação deve ser SMART (específica, mensurável, atribuível, relevante, temporal).
3. Use as 6 dimensões NR-1 quando aplicável: demandas_trabalho, organizacao_conteudo, relacoes_lideranca, interface_trabalho_individuo, valores_trabalho, saude_bem_estar.
4. Para ações novas use action="create". Para ajustar uma já existente, use action="update" com o id.
5. Priorize segundo gravidade × esforço: dimensões com score mais alto = maior prioridade.
6. Quanto maior o grau de risco INSS, mais ações estruturais e governança formal.
7. Marque ações com prazo vencido como "atrasado" e proponha replanejamento.
8. Nunca dê diagnóstico clínico individual.
9. Português do Brasil, conciso e prático.

CONTEXTO:
{CONTEXT}
`;

const TOOL = {
  type: "function",
  function: {
    name: "propose_actions",
    description: "Propõe criação ou atualização de ações do plano de ação NR-1.",
    parameters: {
      type: "object",
      properties: {
        resumo: { type: "string", description: "Breve resumo (1-2 frases) do raciocínio." },
        actions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              action: { type: "string", enum: ["create", "update"] },
              id: { type: "string", description: "ID da ação existente (apenas para update)." },
              titulo: { type: "string" },
              descricao: { type: "string" },
              dimensao: {
                type: "string",
                enum: [
                  "demandas_trabalho",
                  "organizacao_conteudo",
                  "relacoes_lideranca",
                  "interface_trabalho_individuo",
                  "valores_trabalho",
                  "saude_bem_estar",
                ],
              },
              prioridade: { type: "string", enum: ["baixa", "media", "alta", "critica"] },
              status: { type: "string", enum: ["pendente", "em_andamento", "concluido", "atrasado"] },
              prazo_dias: { type: "integer", description: "Dias a partir de hoje para o prazo." },
              responsavel_sugerido: { type: "string" },
              progresso: { type: "integer", minimum: 0, maximum: 100 },
              justificativa: { type: "string", description: "Por que esta ação? Cite dimensão/score quando relevante." },
            },
            required: ["action", "titulo", "prioridade", "justificativa"],
            additionalProperties: false,
          },
        },
      },
      required: ["resumo", "actions"],
      additionalProperties: false,
    },
  },
};

async function buildContext(supabase: any) {
  const { data: companyId } = await supabase.rpc("get_user_company_id");
  if (!companyId) return { ctx: "Sem empresa ativa.", companyId: null };

  const [{ data: company }, { data: sub }, { data: diags }, { data: acoes }] = await Promise.all([
    supabase.from("organizational_structure").select("name, industry_sector").eq("id", companyId).maybeSingle(),
    supabase.from("nr1_subscriptions").select("grau_risco_inss, plan_tier").eq("company_id", companyId).maybeSingle(),
    supabase
      .from("nr1_diagnosticos")
      .select("id, ciclo_nome, periodo_inicio, periodo_fim, score_geral, nivel_risco, total_respondentes, scores_dimensao")
      .eq("company_id", companyId)
      .eq("status", "concluido")
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("nr1_planos_acao")
      .select("id, titulo, descricao, dimensao, prioridade, status, prazo, progresso, responsavel")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  let ctx = `EMPRESA: ${company?.name ?? "(sem nome)"}${company?.industry_sector ? ` — Setor: ${company.industry_sector}` : ""}\n`;
  ctx += `GRAU DE RISCO INSS: ${sub?.grau_risco_inss ? GRAU_LABEL[sub.grau_risco_inss] : "não informado"}\n\n`;

  const ultimo = diags?.[0];
  if (ultimo) {
    ctx += `DIAGNÓSTICO MAIS RECENTE: ${ultimo.ciclo_nome} (${ultimo.periodo_inicio} → ${ultimo.periodo_fim})\n`;
    ctx += `  Score geral: ${ultimo.score_geral ?? "—"}/100 | Risco: ${ultimo.nivel_risco ?? "—"} | Respondentes: ${ultimo.total_respondentes}\n`;
    if (ultimo.scores_dimensao && typeof ultimo.scores_dimensao === "object") {
      ctx += `  Scores por dimensão:\n`;
      for (const [k, v] of Object.entries(ultimo.scores_dimensao as Record<string, number>)) {
        ctx += `    - ${k}: ${Number(v).toFixed(1)}\n`;
      }
    }
  } else {
    ctx += `DIAGNÓSTICO: nenhum diagnóstico concluído ainda.\n`;
  }

  ctx += `\nAÇÕES ATUAIS NO PLANO (${acoes?.length ?? 0}):\n`;
  const hoje = new Date();
  for (const a of acoes ?? []) {
    const venc = a.prazo ? new Date(a.prazo) : null;
    const atrasada = venc && venc < hoje && a.status !== "concluido";
    ctx += `  - [${a.id.slice(0, 8)}] "${a.titulo}" | ${a.status} | prio=${a.prioridade} | dim=${a.dimensao ?? "-"} | prazo=${a.prazo ?? "—"}${atrasada ? " ⚠ATRASADA" : ""} | progresso=${a.progresso ?? 0}%\n`;
  }
  return { ctx, companyId };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const auth = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: auth } } });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const instrucao: string = (body?.instrucao ?? "").toString().trim();
    if (!instrucao) {
      return new Response(JSON.stringify({ error: "instrucao obrigatória" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { ctx } = await buildContext(supabase);
    const system = SYSTEM_PROMPT.replace("{CONTEXT}", ctx);

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: instrucao },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "propose_actions" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429)
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em instantes." }), {
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

    const data = await aiResp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    let payload: any = { resumo: "", actions: [] };
    if (call?.function?.arguments) {
      try {
        payload = JSON.parse(call.function.arguments);
      } catch (e) {
        console.error("parse tool args", e);
      }
    }
    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("nr1-plano-acao-assistant error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
