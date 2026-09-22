import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/perplexity";
const CACHE_TTL_HOURS = 24;

const TOPICS: Record<string, { label: string; query: string }> = {
  mercado_rh: {
    label: "Mercado de RH",
    query: "tendências e notícias recentes do mercado de RH e gestão de pessoas no Brasil",
  },
  remuneracao: {
    label: "Remuneração",
    query: "tendências e notícias recentes de remuneração, reajustes e pesquisas salariais no Brasil",
  },
  beneficios: {
    label: "Benefícios",
    query: "tendências e notícias recentes de benefícios corporativos no Brasil",
  },
  legislacao: {
    label: "Legislação trabalhista e NR-1",
    query: "notícias recentes de legislação trabalhista brasileira, NR-1 e riscos psicossociais",
  },
  tendencias: {
    label: "Tendências",
    query: "tendências de gestão de pessoas, futuro do trabalho e cultura organizacional no Brasil",
  },
  dissidios_setor: {
    label: "Movimentações salariais e dissídios por setor",
    query:
      "dissídios, convenções coletivas, pisos salariais e reajustes salariais recentes por setor no Brasil",
  },
  inflacao_remuneracao: {
    label: "Inflação e impacto em remuneração",
    query:
      "inflação IPCA e INPC no Brasil e seu impacto em reajustes salariais e política de remuneração",
  },
  beneficios_total: {
    label: "Tendências de benefícios e remuneração total",
    query:
      "tendências de benefícios corporativos e remuneração total (total rewards) no mercado brasileiro",
  },
  praticas_cargo_regiao: {
    label: "Práticas de mercado por cargo e região",
    query:
      "práticas de mercado de remuneração por cargo e por região no Brasil, pesquisas salariais recentes",
  },
};

// LGPD: qualquer indício de dado interno do cliente bloqueia a pergunta.
const FORBIDDEN_PATTERNS: { re: RegExp; reason: string }[] = [
  { re: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/, reason: "CPF detectado" },
  { re: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/, reason: "CNPJ detectado" },
  { re: /[\w.+-]+@[\w-]+\.[\w.]+/, reason: "e-mail detectado" },
  { re: /\bmatr[íi]cula\b/i, reason: "matrícula de colaborador" },
  { re: /\b(sal[áa]rio|remunera[çc][ãa]o)\s+(d[oae]|de)\s+\p{Lu}/u, reason: "salário de pessoa identificada" },
  { re: /\bR\$\s?\d/i, reason: "valor monetário interno" },
  { re: /\b(colaborador|funcion[áa]rio|empregado)\s+\p{Lu}\p{Ll}+/u, reason: "nome de colaborador" },
  { re: /\b(nossa empresa|minha empresa|nosso quadro|nossos colaboradores|nossa folha|meus colaboradores)\b/i, reason: "dado interno da empresa" },
  { re: /\b(profiles|job_titles|salary_ranges|performance_evaluations|tenant_id|root_company_id)\b/i, reason: "referência a dados internos" },
];

const ALLOWED_TERMS = /\b(rh|recursos humanos|remunera|sal[áa]ri|benef[íi]ci|legisla|trabalhis|nr-?1|nr\s?1|psicossoc|tend[êe]nci|mercado|gest[ãa]o de pessoas|talento|clt|sindic|reajust|conven[çc][ãa]o coletiva|turnover|engajamento|diss[íi]di|piso salarial|ipca|inpc|infla[çc][ãa]o|total rewards|remunera[çc][ãa]o total|pr[áa]tica de mercado|pr[áa]ticas de mercado|pesquisa salarial|regi[ãa]o|setor)/i;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Autenticação obrigatória" }, 401);
    }

    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return json({ error: "Sessão inválida ou expirada" }, 401);
    }

    const { data: profile } = await serviceClient
      .from("profiles")
      .select("root_company_id")
      .eq("id", user.id)
      .maybeSingle();
    const companyId = profile?.root_company_id ?? null;

    const body = await req.json().catch(() => ({}));
    const topicKey: string = typeof body?.topic === "string" && TOPICS[body.topic] ? body.topic : "mercado_rh";
    const topic = TOPICS[topicKey];
    const customQuestion: string | null =
      typeof body?.question === "string" && body.question.trim().length > 3 ? body.question.trim().slice(0, 300) : null;
    const forceRefresh = body?.refresh === true;
    const question = customQuestion ?? topic.query;

    const logUsage = (fields: Record<string, unknown>) =>
      serviceClient.from("market_insights_usage").insert({
        user_id: user.id,
        root_company_id: companyId,
        question,
        topic: topicKey,
        ...fields,
      });

    // --- Gating LGPD: bloqueia dado interno e restringe ao escopo permitido ---
    const forbidden = FORBIDDEN_PATTERNS.find((p) => p.re.test(question));
    if (forbidden) {
      await logUsage({ rejected: true, rejection_reason: forbidden.reason });
      return json(
        { error: "Consulta recusada: não é permitido enviar dados internos ou pessoais. Use apenas temas públicos de mercado e legislação.", rejected: true },
        400,
      );
    }
    if (customQuestion && !ALLOWED_TERMS.test(question)) {
      await logUsage({ rejected: true, rejection_reason: "tema fora do escopo permitido" });
      return json(
        { error: "Consulta recusada: apenas temas de mercado de RH, remuneração, benefícios, legislação trabalhista/NR-1 e tendências.", rejected: true },
        400,
      );
    }

    const cacheKey = `${topicKey}::${question.toLowerCase().replace(/\s+/g, " ")}`;

    const { data: cached } = await serviceClient
      .from("market_insights_cache")
      .select("result, fetched_at, expires_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    const cacheValid = cached && new Date(cached.expires_at as string).getTime() > Date.now();

    if (cacheValid && !forceRefresh) {
      await logUsage({ from_cache: true });
      return json({ ...(cached!.result as Record<string, unknown>), fetched_at: cached!.fetched_at, from_cache: true });
    }

    // --- Rate limit: 5 buscas novas por usuário por hora ---
    const { data: allowed } = await serviceClient.rpc("check_rate_limit", {
      p_user_id: user.id,
      p_function_name: "market-insights",
      p_max_requests: 5,
      p_window_minutes: 60,
    });

    if (allowed === false) {
      await logUsage({ from_cache: !!cached, rejected: true, rejection_reason: "rate_limited" });
      if (cached) {
        return json({
          ...(cached.result as Record<string, unknown>),
          fetched_at: cached.fetched_at,
          from_cache: true,
          rate_limited: true,
        });
      }
      return json({ error: "Limite de atualizações por hora atingido. Tente novamente mais tarde.", rate_limited: true }, 429);
    }

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const connectionKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!lovableKey || !connectionKey) {
      return json({ error: "Conexão de busca não configurada" }, 500);
    }

    const searchRes = await fetch(`${GATEWAY_URL}/search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": connectionKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `${question} (${new Date().getFullYear()})`,
        max_results: 8,
        search_recency_filter: "week",
      }),
    });

    if (!searchRes.ok) {
      const details = await searchRes.text();
      console.error(`Perplexity search failed [${searchRes.status}]: ${details}`);
      await logUsage({ rejected: true, rejection_reason: `busca falhou (${searchRes.status})` });
      if (cached) {
        return json({ ...(cached.result as Record<string, unknown>), fetched_at: cached.fetched_at, from_cache: true, stale: true });
      }
      return json({ error: "Falha ao buscar conteúdo de mercado", status: searchRes.status, details }, searchRes.status);
    }

    const searchJson = await searchRes.json();
    const results: Array<{ title?: string; url?: string; snippet?: string; date?: string }> =
      searchJson?.results ?? [];

    let items = results.slice(0, 6).map((r) => ({
      title: r.title ?? "Sem título",
      summary: (r.snippet ?? "").slice(0, 400),
      source_url: r.url ?? null,
      source_name: r.url ? safeHost(r.url) : null,
      published_at: r.date ?? null,
    }));

    // Síntese opcional de títulos/resumos a partir do texto público dos resultados.
    if (items.length && lovableKey) {
      const synthesized = await synthesize(items, topic.label, lovableKey);
      if (synthesized) items = synthesized;
    }

    const result = { topic: topicKey, topic_label: topic.label, question, items };
    const now = new Date();
    const expires = new Date(now.getTime() + CACHE_TTL_HOURS * 3600 * 1000);

    await serviceClient.from("market_insights_cache").upsert(
      {
        cache_key: cacheKey,
        question,
        topic: topicKey,
        result,
        fetched_at: now.toISOString(),
        expires_at: expires.toISOString(),
      },
      { onConflict: "cache_key" },
    );

    await logUsage({ from_cache: false });

    return json({ ...result, fetched_at: now.toISOString(), from_cache: false });
  } catch (error) {
    console.error("market-insights error:", error);
    return json({ error: error instanceof Error ? error.message : "Erro inesperado" }, 500);
  }
});

function safeHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

type Item = {
  title: string;
  summary: string;
  source_url: string | null;
  source_name: string | null;
  published_at: string | null;
};

async function synthesize(items: Item[], topicLabel: string, lovableKey: string): Promise<Item[] | null> {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": lovableKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        reasoning: { effort: "low", summary: "auto" },
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Tema: ${topicLabel}. Reescreva cada resultado de busca abaixo como um título curto em português (máx. 80 caracteres) e um resumo objetivo de 1 a 2 frases. Não invente fatos nem fontes. Responda em JSON com a chave "items": lista de objetos {"index": número do item, "title": string, "summary": string}.\n\n${items
                  .map((it, i) => `[${i}] ${it.title} — ${it.summary}`)
                  .join("\n")}`,
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "insights",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["items"],
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["index", "title", "summary"],
                    properties: {
                      index: { type: "number" },
                      title: { type: "string" },
                      summary: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    });

    if (!res.ok || !res.body) {
      console.error("synthesize failed:", res.status, await res.text().catch(() => ""));
      return null;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
            text += evt.delta;
          }
        } catch {
          // ignora evento não-JSON
        }
      }
    }

    if (!text.trim()) return null;
    const parsed = JSON.parse(text);
    const list: Array<{ index: number; title: string; summary: string }> = parsed?.items ?? [];
    if (!Array.isArray(list) || !list.length) return null;

    return items.map((it, i) => {
      const match = list.find((l) => Number(l.index) === i);
      return match ? { ...it, title: match.title || it.title, summary: match.summary || it.summary } : it;
    });
  } catch (error) {
    console.error("synthesize error:", error);
    return null;
  }
}
