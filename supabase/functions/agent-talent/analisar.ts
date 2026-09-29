import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { extractText, getDocumentProxy } from "npm:unpdf@0.12.1";

type Json = (body: unknown, status?: number) => Response;

const Saida = z.object({
  match_score: z.number().int().min(0).max(100),
  pontos_fortes: z.array(z.string()).max(12),
  gaps: z.array(z.string()).max(12),
  recomendacao: z.enum(["avancar", "agendar_entrevista", "arquivar"]),
  justificativa: z.string().min(1).max(1500),
});

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["match_score", "pontos_fortes", "gaps", "recomendacao", "justificativa"],
  properties: {
    match_score: { type: "integer", minimum: 0, maximum: 100 },
    pontos_fortes: { type: "array", items: { type: "string" } },
    gaps: { type: "array", items: { type: "string" } },
    recomendacao: { type: "string", enum: ["avancar", "agendar_entrevista", "arquivar"] },
    justificativa: { type: "string" },
  },
};

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** LGPD: remove dados pessoais do texto do currículo. Retorna o texto e a contagem de substituições. */
export const anonimizarCurriculo = (texto: string, nome: string, email: string, telefone: string | null) => {
  let n = 0;
  const rep = (re: RegExp, tag: string) => {
    texto = texto.replace(re, () => { n++; return tag; });
  };
  const partes = nome.split(/\s+/).filter((p) => p.length >= 3);
  if (nome.trim()) rep(new RegExp(esc(nome.trim()), "gi"), "[nome]");
  for (const p of partes) rep(new RegExp(`\\b${esc(p)}\\b`, "gi"), "[nome]");
  if (email) rep(new RegExp(esc(email), "gi"), "[email]");
  rep(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]");
  rep(/https?:\/\/\S+|www\.\S+|linkedin\.com\/\S*|github\.com\/\S*/gi, "[link]");
  rep(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[cpf]");
  rep(/\b\d{2}\.?\d{3}\.?\d{3}-?[\dxX]\b/g, "[rg]");
  rep(/\b\d{5}-?\d{3}\b/g, "[cep]");
  const tel = (telefone ?? "").replace(/\D/g, "");
  if (tel.length >= 8) rep(new RegExp(tel.slice(-8).split("").join("\\D?"), "g"), "[telefone]");
  rep(/(\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}\b/g, "[telefone]");
  rep(/\b(rua|av\.?|avenida|travessa|alameda|rodovia|estrada|praça)\s+[^\n,]{2,60}(,\s*(n[ºo°.]?\s*)?\d+)?/gi, "[endereço]");
  rep(/\b(nascid[oa] em|data de nascimento|estado civil|nacionalidade)[^\n]*/gi, "[dado pessoal]");
  return { texto, substituicoes: n };
};

export async function analisarCandidatura(
  candidaturaId: string,
  auth: string,
  apiKey: string,
  signal: AbortSignal,
  json: Json,
  quem: { userId: string; empresaId: string | null },
) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  // RLS garante que só o RH da mesma empresa lê a candidatura.
  const { data: c, error } = await userClient
    .from("candidaturas")
    .select("id, root_company_id, candidato_id, etapa, analise_talent, candidatos(nome, email, telefone, curriculo_url), vagas(titulo, cbo, area, senioridade, responsabilidades, requisitos_obrigatorios, requisitos_desejaveis, competencias)")
    .eq("id", candidaturaId)
    .maybeSingle();
  if (error || !c) return json({ error: "Candidatura não encontrada." }, 404);
  if (quem.empresaId !== null && c.root_company_id !== quem.empresaId) {
    return json({ error: "Sem permissão para analisar currículos.", code: "sem_permissao" }, 403);
  }
  // deno-lint-ignore no-explicit-any
  const cand = (c as any).candidatos, vaga = (c as any).vagas;
  // deno-lint-ignore no-explicit-any
  const notaAnterior: number | null = (c as any).analise_talent?.match_score ?? null;
  if (!cand?.curriculo_url) return json({ error: "Este candidato não tem currículo anexado.", code: "sem_curriculo" }, 422);

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: file, error: dlErr } = await admin.storage.from("curriculos").download(cand.curriculo_url);
  if (dlErr || !file) return json({ error: "Currículo não encontrado." }, 404);
  if (file.size > 10 * 1024 * 1024) {
    return json({ error: "PDF acima de 10 MB. Siga com a triagem manual.", code: "pdf_grande" }, 413);
  }

  let bruto = "";
  try {
    const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
    const r = await extractText(pdf, { mergePages: true });
    bruto = (Array.isArray(r.text) ? r.text.join("\n") : r.text).replace(/[ \t]+/g, " ").trim();
  } catch (_e) {
    bruto = "";
  }
  if (bruto.replace(/\s/g, "").length < 80) {
    console.log("agent-talent analisar sem_texto", { chars: bruto.length });
    return json({ error: "Não foi possível ler o PDF (parece ser imagem ou escaneado). Siga com a triagem manual.", code: "pdf_sem_texto" }, 422);
  }

  const { texto, substituicoes } = anonimizarCurriculo(bruto.slice(0, 20000), cand.nome ?? "", cand.email ?? "", cand.telefone);
  console.log("agent-talent analisar", { chars_pdf: bruto.length, chars_enviados: texto.length, substituicoes });

  const vagaTxt = [
    `Cargo: ${vaga?.titulo ?? ""}`, `CBO: ${vaga?.cbo ?? "não informado"}`, `Área: ${vaga?.area ?? "não informada"}`,
    `Senioridade: ${vaga?.senioridade ?? ""}`, `Responsabilidades:\n${vaga?.responsabilidades ?? "-"}`,
    `Requisitos obrigatórios:\n${vaga?.requisitos_obrigatorios ?? "-"}`, `Requisitos desejáveis:\n${vaga?.requisitos_desejaveis ?? "-"}`,
    `Competências: ${(vaga?.competencias ?? []).join(", ")}`,
  ].join("\n");

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      stream: true,
      store: false,
      reasoning: { effort: "low", summary: "auto" },
      include: ["reasoning.encrypted_content"],
      instructions:
        "Você é o Talent, agente de Recrutamento & Seleção da CompSmart. Avalie a aderência do currículo (já anonimizado) à vaga, de forma objetiva e sem viés: ignore gênero, idade, origem, estado civil e qualquer característica pessoal. Você apenas sugere; o RH decide. Responda em português do Brasil.",
      input: `VAGA\n${vagaTxt}\n\nCURRÍCULO (anonimizado)\n${texto}\n\nDê match_score inteiro 0-100, 3 a 6 pontos fortes, 2 a 6 lacunas curtas, a recomendação (avancar, agendar_entrevista ou arquivar) e uma justificativa de até 4 frases.`,
      text: { format: { type: "json_schema", name: "analise_candidato", strict: true, schema } },
    }),
  });

  if (resp.status === 402) return json({ error: "Os créditos de IA acabaram. Peça ao administrador para recarregar e tente de novo.", code: 402 }, 402);
  if (resp.status === 429) return json({ error: "Muitos pedidos em sequência. Aguarde um minuto e tente novamente.", code: 429 }, 429);
  if (!resp.ok || !resp.body) {
    console.error("agent-talent analisar gateway", resp.status);
    return json({ error: "O agente Talent não conseguiu analisar agora." }, resp.status === 403 ? 403 : 502);
  }

  const reader = resp.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "", out = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const p = line.slice(5).trim();
      if (!p || p === "[DONE]") continue;
      try { const ev = JSON.parse(p); if (ev.type === "response.output_text.delta") out += ev.delta ?? ""; } catch { /* ignore */ }
    }
  }

  let parsed: unknown = null;
  try { parsed = JSON.parse(out); } catch { parsed = null; }
  const ok = Saida.safeParse(parsed);
  if (!ok.success) {
    console.error("agent-talent analisar formato_invalido", { chars: out.length });
    return json({ error: "O agente Talent devolveu uma resposta fora do formato. Tente novamente.", code: "formato_invalido" }, 502);
  }
  const analise = {
    ...ok.data,
    pontos_fortes: ok.data.pontos_fortes.map((s) => s.trim()).filter(Boolean),
    gaps: ok.data.gaps.map((s) => s.trim()).filter(Boolean),
  };
  const { error: upErr } = await admin.from("candidaturas")
    .update({ analise_talent: analise, analise_em: new Date().toISOString(), match_score: analise.match_score })
    .eq("id", candidaturaId);
  if (upErr) return json({ error: "Não foi possível salvar a análise." }, 500);
  if (notaAnterior !== null) {
    // Reanálise: evento auditável; não mexe em etapa nem etapa_desde.
    const { error: hErr } = await admin.from("candidato_historico").insert({
      root_company_id: c.root_company_id, candidatura_id: c.id, candidato_id: c.candidato_id,
      etapa_anterior: c.etapa, etapa_nova: c.etapa, origem: "agente", criado_por: quem.userId,
      motivo: `Reanálise do currículo: nota ${notaAnterior} → ${analise.match_score}`,
    });
    if (hErr) console.error("agent-talent reanalise historico", hErr.code);
  }
  return json({ analise });
}
