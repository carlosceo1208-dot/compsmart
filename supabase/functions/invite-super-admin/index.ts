// Edge Function: invite-super-admin
// Creates a new super_admin user and sends an invitation email so the
// invitee defines their own password. Caller MUST already be super_admin.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FALLBACK_APP_BASE_URL = "https://compsmart.ia.br";
const ALLOWED_APP_HOSTS = new Set([
  "compsmart.ia.br",
  "www.compsmart.ia.br",
  "smartcomp.ia.br",
  "www.smartcomp.ia.br",
  "compsmart.lovable.app",
]);

function isAllowedAppHost(host: string) {
  if (ALLOWED_APP_HOSTS.has(host)) return true;
  return host.endsWith(".lovable.app");
}

function resolveAppBaseUrl(req: Request) {
  const candidates = [req.headers.get("origin"), req.headers.get("referer")];

  for (const candidate of candidates) {
    if (!candidate) continue;

    try {
      const url = new URL(candidate);
      if (isAllowedAppHost(url.host)) {
        return `${url.protocol}//${url.host}`;
      }
    } catch {
      // ignore malformed header and continue with the next candidate
    }
  }

  return FALLBACK_APP_BASE_URL;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // ---- Authenticate caller ----
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = claims.claims.sub as string;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // ---- Caller must be super_admin ----
    const { data: callerRoles } = await admin
      .from("user_roles").select("role").eq("user_id", callerId);
    const isSuperAdmin = (callerRoles ?? []).some((r: any) => r.role === "super_admin");
    if (!isSuperAdmin) {
      return new Response(JSON.stringify({ error: "Apenas super administradores podem usar este recurso." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Caller's company (used as root_company_id for the new admin) ----
    const { data: callerProfile } = await admin
      .from("profiles").select("root_company_id").eq("id", callerId).single();
    const companyId = callerProfile?.root_company_id;
    if (!companyId) {
      return new Response(JSON.stringify({ error: "Sua conta não está vinculada a uma empresa." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Input ----
    const { invites } = await req.json() as {
      invites: Array<{ email: string; full_name: string }>;
    };
    if (!Array.isArray(invites) || invites.length === 0) {
      return new Response(JSON.stringify({ error: "Lista de convites vazia." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const appBaseUrl = resolveAppBaseUrl(req);
    const redirectTo = `${appBaseUrl}/reset-password?mode=invite`;

    const results: any[] = [];

    for (const inv of invites) {
      const email = String(inv.email || "").trim().toLowerCase();
      const fullName = String(inv.full_name || "").trim();
      if (!email || !fullName) {
        results.push({ email, ok: false, error: "Nome ou e-mail inválido" });
        continue;
      }

      try {
        let userId: string | undefined;
        let actionLink: string | undefined;

        // 1) Check if user already exists (avoids hitting email rate limits via invite)
        const { data: existingList } = await admin.auth.admin.listUsers();
        const existing = existingList?.users?.find(
          (u: any) => u.email?.toLowerCase() === email,
        );

        if (existing) {
          // User exists → just generate a recovery link (does NOT send email)
          userId = existing.id;
          const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
            type: "recovery", email, options: { redirectTo },
          });
          if (linkErr) throw linkErr;
          actionLink = (linkData as any)?.properties?.action_link;
        } else {
          // New user → invite (creates auth.users + sends email)
          const { data: inviteData, error: inviteErr } =
            await admin.auth.admin.inviteUserByEmail(email, {
              redirectTo,
              data: { full_name: fullName, invited_role: "super_admin" },
            });
          if (inviteErr) {
            // If invite failed due to email rate limit, try generating a signup link instead
            if (/rate.?limit/i.test(inviteErr.message)) {
              const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
                type: "invite", email, options: { data: { full_name: fullName }, redirectTo },
              });
              if (linkErr) throw inviteErr;
              userId = (linkData as any)?.user?.id;
              actionLink = (linkData as any)?.properties?.action_link;
            } else {
              throw inviteErr;
            }
          } else {
            userId = inviteData?.user?.id;
          }
        }

        if (!userId) throw new Error("Usuário não criado");

        // 2) Upsert profile vinculado à empresa do convidante
        await admin.from("profiles").upsert({
          id: userId,
          email,
          full_name: fullName,
          root_company_id: companyId,
          status: "active",
          has_system_access: true,
        }, { onConflict: "id" });

        // 3) Garantir role super_admin
        await admin.from("user_roles").upsert({
          user_id: userId, role: "super_admin",
        }, { onConflict: "user_id,role" });

        // 4) Audit log (best effort)
        await admin.from("nr1_access_log").insert({
          company_id: companyId,
          actor_id: callerId,
          actor_role: "super_admin",
          action: "invite_super_admin",
          resource: email,
        }).then(() => {}, () => {});

        results.push({ email, ok: true, user_id: userId, action_link: actionLink });
      } catch (e: any) {
        console.error("[invite-super-admin] erro:", email, e?.message);
        results.push({ email, ok: false, error: 'Falha ao convidar' });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[invite-super-admin] fatal:", err);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
