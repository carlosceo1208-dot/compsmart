// Admin-only one-shot migration: converts legacy public storage URLs stored in
// profiles.avatar_url and organizational_structure.logo_url into fresh 10-year
// signed URLs, so existing records keep working after the buckets were switched
// to private.
//
// Requires the caller to be authenticated as a super_admin.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

function extractPath(bucket: string, url: string | null | undefined): string | null {
  if (!url) return null;
  const re = new RegExp(`/storage/v1/object/(?:public|sign)/${bucket}/([^?]+)`);
  const m = url.match(re);
  return m?.[1] ? decodeURIComponent(m[1]) : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isSuper, error: roleErr } = await admin.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "super_admin",
    });
    if (roleErr || !isSuper) {
      return new Response(JSON.stringify({ error: "Forbidden: super_admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const summary = { avatars: { scanned: 0, refreshed: 0, failed: 0 }, logos: { scanned: 0, refreshed: 0, failed: 0 } };

    // Avatars
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, avatar_url")
      .not("avatar_url", "is", null)
      .like("avatar_url", "%/object/public/%");
    for (const p of profiles ?? []) {
      summary.avatars.scanned++;
      const path = extractPath("avatars", p.avatar_url);
      if (!path) { summary.avatars.failed++; continue; }
      const { data: signed, error } = await admin.storage.from("avatars").createSignedUrl(path, TEN_YEARS);
      if (error || !signed?.signedUrl) { summary.avatars.failed++; continue; }
      const { error: updErr } = await admin.from("profiles").update({ avatar_url: signed.signedUrl }).eq("id", p.id);
      if (updErr) summary.avatars.failed++; else summary.avatars.refreshed++;
    }

    // Logos
    const { data: orgs } = await admin
      .from("organizational_structure")
      .select("id, logo_url")
      .not("logo_url", "is", null)
      .like("logo_url", "%/object/public/%");
    for (const o of orgs ?? []) {
      summary.logos.scanned++;
      const path = extractPath("company-logos", o.logo_url);
      if (!path) { summary.logos.failed++; continue; }
      const { data: signed, error } = await admin.storage.from("company-logos").createSignedUrl(path, TEN_YEARS);
      if (error || !signed?.signedUrl) { summary.logos.failed++; continue; }
      const { error: updErr } = await admin.from("organizational_structure").update({ logo_url: signed.signedUrl }).eq("id", o.id);
      if (updErr) summary.logos.failed++; else summary.logos.refreshed++;
    }

    return new Response(JSON.stringify({ ok: true, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("refresh-storage-urls error", e);
    return new Response(JSON.stringify({ error: e?.message ?? "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
