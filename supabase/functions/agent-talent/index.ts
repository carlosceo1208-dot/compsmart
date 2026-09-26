import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const Body = z.object({
  titulo: z.string().trim().min(2).max(200),
  area: z.string().trim().max(120).optional().default(""),
  senioridade: z.enum(["junior", "pleno", "senior", "especialista"]),
  cbo: z.string().trim().max(20).optional().default(""),
  descricaoParcial: z.string().max(4000).optional().default(""),
});

// LGPD: remove qualquer dado pessoal que possa ter sido colado em texto livre.
const anonimizar = (t: string) =>
  t
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]")
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[cpf]")
    .replace(/\(?\d{2}\)?\s?9?\d{4}-?\d{4}\b/g, "[telefone]");

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["responsabilidades", "requisitos_obrigatorios", "requisitos_desejaveis", "competencias"],
  properties: {
    responsabilidades: { type: "array", items: { type: "string" } },
    requisitos_obrigatorios: { type: "array", items: { type: "string" } },
    requisitos_desejaveis: { type: "array", items: { type: "string" } },
    competencias: { type: "array", items: { type: "string" } },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Autorização necessária" }, 401);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData, error: authErr } = await userClient.auth.getUser();
    if (authErr || !userData.user) return json({ error: "Usuário não autenticado" }, 401);

    const { data: hasMod } = await userClient.rpc("has_module", { _slug: "talent" } as never);
    const { data: isSuper } = await userClient.rpc("has_role", { _user_id: userData.user.id, _role: "super_admin" } as never);
    if (hasMod !== true && isSuper !== true) return json({ error: "Módulo Recrutamento & Seleção não contratado." }, 403);

    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }, 400);
    const d = parsed.data;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "Configuração de IA ausente." }, 500);

    const prompt = anonimizar(
      `Crie o perfil de uma vaga para o mercado brasileiro.\nCargo: ${d.titulo}\nÁrea: ${d.area || "não informada"}\nSenioridade: ${d.senioridade}\nCBO: ${d.cbo || "não informado"}\n${d.descricaoParcial ? `Descrição parcial do RH (complete sem contradizer):\n${d.descricaoParcial}\n` : ""}\nRetorne 5 a 8 responsabilidades, 4 a 6 requisitos obrigatórios, 3 a 5 desejáveis e 5 a 8 competências (curtas). Português do Brasil, frases objetivas.`,
    );

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      signal: req.signal,
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low", summary: "auto" },
        include: ["reasoning.encrypted_content"],
        instructions: "Você é o Talent, agente de Recrutamento & Seleção da CompSmart. Nunca inclua dados pessoais.",
        input: prompt,
        text: { format: { type: "json_schema", name: "perfil_vaga", strict: true, schema } },
      }),
    });

    if (resp.status === 402) return json({ error: "Os créditos de IA acabaram. Peça ao administrador para recarregar e tente de novo.", code: 402 }, 402);
    if (resp.status === 429) return json({ error: "Muitos pedidos em sequência. Aguarde um minuto e tente novamente.", code: 429 }, 429);
    if (!resp.ok || !resp.body) {
      console.error("agent-talent gateway", resp.status, await resp.text().catch(() => ""));
      return json({ error: "O agente Talent não conseguiu gerar o perfil agora." }, resp.status === 403 ? 403 : 502);
    }

    const reader = resp.body.pipeThrough(new TextDecoderStream()).getReader();
    let buf = "", text = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += value;
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload);
          if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
        } catch { /* ignore */ }
      }
    }

    let perfil;
    try { perfil = JSON.parse(text); } catch { perfil = null; }
    if (!perfil || !Array.isArray(perfil.responsabilidades)) {
      return json({ error: "O agente Talent retornou uma resposta vazia. Tente novamente." }, 502);
    }
    const clean = (a: unknown) => (Array.isArray(a) ? a.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 12) : []);
    return json({
      responsabilidades: clean(perfil.responsabilidades),
      requisitos_obrigatorios: clean(perfil.requisitos_obrigatorios),
      requisitos_desejaveis: clean(perfil.requisitos_desejaveis),
      competencias: clean(perfil.competencias),
    });
  } catch (e) {
    if (req.signal.aborted) return new Response(null, { status: 499 });
    console.error("agent-talent", e);
    return json({ error: "Erro inesperado ao gerar o perfil." }, 500);
  }
});
