import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

const Body = z.object({ candidatoId: z.string().uuid() });
const json = (status: number, b: unknown) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Método não permitido" });

  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json(401, { error: "Não autenticado" });

  const url = Deno.env.get("SUPABASE_URL")!;
  // Cliente com o token do usuário: RLS de candidatos e do storage decide o acesso.
  const sb = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: claims, error: ce } = await sb.auth.getClaims(auth.slice(7));
  if (ce || !claims?.claims?.sub) return json(401, { error: "Não autenticado" });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json(400, { error: "Dados inválidos" });

  const { data: cand } = await sb.from("candidatos").select("curriculo_url, root_company_id")
    .eq("id", parsed.data.candidatoId).maybeSingle();
  if (!cand) return json(403, { error: "Sem permissão" });
  if (!cand.curriculo_url) return json(404, { error: "Currículo não encontrado" });
  if (!String(cand.curriculo_url).startsWith(`${cand.root_company_id}/`)) return json(403, { error: "Sem permissão" });

  // Link fresco (1h), gerado na hora e nunca salvo; o storage aplica a política do RH da empresa.
  const { data: signed, error: se } = await sb.storage.from("curriculos").createSignedUrl(cand.curriculo_url, 3600);
  if (se || !signed) return json(se?.message?.toLowerCase().includes("not found") ? 404 : 403, { error: "Sem acesso ao arquivo" });
  const file = await fetch(signed.signedUrl);
  if (!file.ok) return json(file.status === 404 || file.status === 400 ? 404 : 502, { error: "Falha ao obter o arquivo" });

  return new Response(file.body, {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/pdf", "Cache-Control": "no-store" },
  });
});
