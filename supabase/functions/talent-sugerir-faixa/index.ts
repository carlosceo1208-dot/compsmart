import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

// Esquema estrito: qualquer campo extra (ex.: _user forjado) é recusado.
const Body = z.object({
  company: z.string().uuid(),
  titulo: z.string().max(200).default(""),
  cbo: z.string().max(20).default(""),
  grade: z.string().max(50).default(""),
  cargoId: z.string().uuid().nullable().default(null),
}).strict();

const FONTES = new Set(["pesquisa de mercado", "tabela salarial", "dados da empresa"]);
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const auth = req.headers.get("Authorization") ?? "";
  // _user vem SÓ do login validado.
  const { data: u } = auth.startsWith("Bearer ") ? await admin.auth.getUser(auth.slice(7)) : { data: { user: null } };
  const userId = u?.user?.id ?? null;

  let raw: unknown = null;
  try { raw = await req.json(); } catch { /* corpo inválido */ }
  const parsed = Body.safeParse(raw);
  const company = (raw as { company?: string })?.company;
  const companyOk = typeof company === "string" && /^[0-9a-f-]{36}$/i.test(company) ? company : null;

  const negar = async (motivo: string) => {
    let papel: string[] = [];
    if (userId) {
      const { data } = await admin.from("user_roles").select("role").eq("user_id", userId);
      papel = (data ?? []).map((r) => r.role as string);
    }
    await admin.from("audit_logs").insert({
      action: "talent_sugerir_faixa_negado", table_name: "survey_data", user_id: userId,
      root_company_id: companyOk, new_data: { motivo, papel, empresa_destino: companyOk },
    });
    return json({ error: "Acesso negado" }, 403);
  };

  if (!userId) return negar("sem_login");
  if (!parsed.success) return parsed.error.issues.some((i) => i.code === "unrecognized_keys") ? negar("campo_nao_permitido") : json({ error: "Dados inválidos" }, 400);
  const b = parsed.data;

  const { data, error } = await admin.rpc("talent_sugerir_faixa", {
    _user: userId, _company: b.company, _titulo: b.titulo, _cbo: b.cbo, _grade: b.grade, _cargo_id: b.cargoId, _pontos: null,
  });
  if (error) return error.code === "42501" ? negar("sem_permissao") : json({ error: "Falha ao sugerir faixa" }, 500);
  const r = (data ?? {}) as Record<string, unknown>;
  const fonte = typeof r.fonte === "string" && FONTES.has(r.fonte) ? r.fonte : null;
  const min = typeof r.min === "number" && fonte ? r.min : null;
  const max = typeof r.max === "number" && fonte ? r.max : null;
  return json({ min, max, fonte });
});
