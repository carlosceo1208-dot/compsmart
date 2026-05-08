import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_ATTEMPT_TYPES = new Set(["login", "signup", "password_reset", "mfa_verify"]);

// In-memory IP rate limiter: 20 requests / minute / IP
const ipBuckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW = 60_000;
const MAX_PER_WINDOW = 20;

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const b = ipBuckets.get(ip);
  if (!b || now > b.resetAt) {
    ipBuckets.set(ip, { count: 1, resetAt: now + WINDOW });
    return true;
  }
  if (b.count >= MAX_PER_WINDOW) return false;
  b.count++;
  return true;
}

interface AuthAttemptPayload {
  email: string;
  user_id?: string | null;
  attempt_type: string;
  success: boolean;
  failure_reason?: string | null;
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Always answer 200 to keep client behavior silent — but enforce server-side validation/rate-limit.
  const silentOk = () => new Response(JSON.stringify({ success: true }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const ip_address =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";

    if (!rateLimit(ip_address)) {
      return new Response(JSON.stringify({ error: "Too many requests" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const payload: AuthAttemptPayload = await req.json();

    // SECURITY: validate fields strictly
    if (!payload.email || typeof payload.email !== "string" || payload.email.length > 255) return silentOk();
    if (!ALLOWED_ATTEMPT_TYPES.has(payload.attempt_type)) return silentOk();
    if (typeof payload.success !== "boolean") return silentOk();

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const cleanEmail = payload.email.toLowerCase().trim();
    if (!emailRegex.test(cleanEmail)) return silentOk();

    const failureReason = (payload.failure_reason ?? null);
    if (failureReason && (typeof failureReason !== "string" || failureReason.length > 500)) return silentOk();

    const user_agent = (req.headers.get("user-agent") || "unknown").slice(0, 500);

    const { error } = await supabase.from("auth_attempt_logs").insert({
      email: cleanEmail,
      // SECURITY: never trust caller-supplied user_id on this unauthenticated endpoint
      user_id: null,
      attempt_type: payload.attempt_type,
      success: payload.success,
      failure_reason: failureReason,
      ip_address,
      user_agent,
      metadata: payload.metadata && typeof payload.metadata === "object" ? payload.metadata : {},
    });
    if (error) console.error("auth log insert error", error.message);

    return silentOk();
  } catch (err) {
    console.error("log-auth-attempt error:", (err as Error).message);
    return silentOk();
  }
});
