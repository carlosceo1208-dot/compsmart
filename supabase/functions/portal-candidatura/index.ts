import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const MAX_BYTES = 5 * 1024 * 1024;
const RATE_MAX = 5; // candidaturas por IP
const RATE_WINDOW_MIN = 10;
const MSG_LIMITE = "Muitas tentativas — tente novamente em instantes.";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const Body = z.object({
  slug: z.string().trim().min(1).max(80),
  nome: z.string().trim().min(2, "Informe seu nome").max(150),
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(255),
  telefone: z.string().trim().refine((v) => [10, 11].includes(v.replace(/\D/g, "").length), "Telefone inválido"),
  cargo_pretendido: z.string().trim().max(150).optional().default(""),
  senioridade: z.enum(["junior", "pleno", "senior", "especialista", "profissional", "consultor"]).optional(),
  consentimento: z.literal(true, { errorMap: () => ({ message: "O aceite é obrigatório" }) }),
  consentimento_versao: z.string().trim().min(1).max(40),
  turnstileToken: z.string().max(4096).optional().default(""),
  curriculo_base64: z.string().max(7_200_000).optional(),
});

const sha256 = async (s: string) =>
  Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))))
    .map((b) => b.toString(16).padStart(2, "0")).join("");

const isDevOrigin = (origin: string) => {
  try {
    const h = new URL(origin).hostname;
    return h === "localhost" || h.endsWith(".lovableproject.com") || h.startsWith("id-preview--");
  } catch { return false; }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);
  try {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: "Dados inválidos", fields: parsed.error.flatten().fieldErrors }, 400);
    const b = parsed.data;

    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "desconhecido";
    const ua = (req.headers.get("user-agent") ?? "").slice(0, 300);
    const origin = req.headers.get("origin") ?? "";
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Limite por IP
    const ipHash = await sha256(ip);
    const since = new Date(Date.now() - RATE_WINDOW_MIN * 60_000).toISOString();
    const { count } = await db.from("portal_rate_limit").select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash).gte("created_at", since);
    if ((count ?? 0) >= RATE_MAX) return json({ error: MSG_LIMITE, code: "rate_limit" }, 429);
    await db.from("portal_rate_limit").insert({ ip_hash: ipHash });

    // Anti-robô: obrigatório no site publicado; no preview/localhost aceita falha do widget para não travar testes.
    const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
    if (!isDevOrigin(origin)) {
      if (!secret || !b.turnstileToken) return json({ error: MSG_LIMITE, code: "captcha" }, 429);
      const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret, response: b.turnstileToken, remoteip: ip }),
      });
      const v = await r.json().catch(() => ({ success: false }));
      if (!v.success) return json({ error: MSG_LIMITE, code: "captcha" }, 429);
    }

    // Empresa SEMPRE derivada da vaga no banco
    const { data: vaga } = await db.from("vagas").select("id, root_company_id, status").eq("slug", b.slug).maybeSingle();
    if (!vaga || vaga.status !== "publicada") return json({ error: "Esta vaga não está mais aberta." }, 404);
    const { data: temModulo } = await db.rpc("talent_company_has_module", { _company: vaga.root_company_id });
    if (!temModulo) return json({ error: "Esta vaga não está mais aberta." }, 404);
    const company = vaga.root_company_id as string;

    // PDF: tamanho + assinatura %PDF
    let pdf: Uint8Array | null = null;
    if (b.curriculo_base64) {
      try { pdf = Uint8Array.from(atob(b.curriculo_base64), (c) => c.charCodeAt(0)); }
      catch { return json({ error: "Envie um arquivo PDF válido", fields: { curriculo: ["Envie um arquivo PDF válido"] } }, 400); }
      if (pdf.byteLength > MAX_BYTES) return json({ error: "O currículo deve ter até 5 MB", fields: { curriculo: ["O currículo deve ter até 5 MB"] } }, 400);
      const sig = new TextDecoder().decode(pdf.slice(0, 5));
      if (sig !== "%PDF-") return json({ error: "Envie um arquivo PDF válido", fields: { curriculo: ["Envie um arquivo PDF válido"] } }, 400);
    }

    const consent = {
      consentimento_lgpd: true, consentimento_data: new Date().toISOString(),
      consentimento_versao: b.consentimento_versao, consentimento_ip: ip, consentimento_user_agent: ua,
    };

    // Candidato: reaproveita por e-mail na mesma empresa
    const { data: existente } = await db.from("candidatos").select("id").eq("root_company_id", company).eq("email", b.email).maybeSingle();
    let candidatoId = existente?.id as string | undefined;
    if (!candidatoId) {
      const { data: novo, error } = await db.from("candidatos").insert({
        root_company_id: company, nome: b.nome, email: b.email, telefone: b.telefone,
        cargo_pretendido: b.cargo_pretendido || null, senioridade: b.senioridade ?? null, fonte: "portal", ...consent,
      }).select("id").single();
      if (error) {
        // corrida: outro envio criou o mesmo e-mail
        const { data: again } = await db.from("candidatos").select("id").eq("root_company_id", company).eq("email", b.email).maybeSingle();
        if (!again) throw error;
        candidatoId = again.id;
      } else candidatoId = novo.id;
    } else {
      await db.from("candidatos").update({
        telefone: b.telefone, ...(b.cargo_pretendido ? { cargo_pretendido: b.cargo_pretendido } : {}),
        ...(b.senioridade ? { senioridade: b.senioridade } : {}), ...consent,
      }).eq("id", candidatoId);
    }

    // Currículo: caminho fixo por candidato — novo PDF sobrescreve o anterior
    if (pdf) {
      const path = `${company}/${candidatoId}.pdf`;
      const { error: upErr } = await db.storage.from("curriculos").upload(path, pdf, { contentType: "application/pdf", upsert: true });
      if (upErr) throw upErr;
      await db.from("candidatos").update({ curriculo_url: path }).eq("id", candidatoId);
    }

    const { error: cErr } = await db.from("candidaturas").insert({ root_company_id: company, candidato_id: candidatoId, vaga_id: vaga.id });
    if (cErr) {
      if ((cErr as { code?: string }).code === "23505") return json({ ok: true, jaInscrito: true });
      throw cErr;
    }
    return json({ ok: true, jaInscrito: false });
  } catch (e) {
    console.error("[portal-candidatura]", e instanceof Error ? e.message : e);
    return json({ error: "Não foi possível enviar sua candidatura agora. Tente novamente." }, 500);
  }
});
