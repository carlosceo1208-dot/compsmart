import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthAttemptPayload {
  email: string;
  user_id?: string | null;
  attempt_type: "login" | "signup" | "password_reset" | "mfa_verify";
  success: boolean;
  failure_reason?: string | null;
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Use service role to insert logs (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: AuthAttemptPayload = await req.json();

    // Validate required fields
    if (!payload.email || !payload.attempt_type || typeof payload.success !== "boolean") {
      console.error("Missing required fields:", payload);
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, attempt_type, success" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract IP and User Agent from request headers
    const ip_address = 
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
      req.headers.get("x-real-ip") || 
      req.headers.get("cf-connecting-ip") || 
      "unknown";
    
    const user_agent = req.headers.get("user-agent") || "unknown";

    // Insert log entry
    const { error: insertError } = await supabase
      .from("auth_attempt_logs")
      .insert({
        email: payload.email.toLowerCase().trim(),
        user_id: payload.user_id || null,
        attempt_type: payload.attempt_type,
        success: payload.success,
        failure_reason: payload.failure_reason || null,
        ip_address,
        user_agent,
        metadata: payload.metadata || {},
      });

    if (insertError) {
      console.error("Error inserting auth log:", insertError);
      // Don't return error to client - logging should be silent
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Auth attempt logged: ${payload.attempt_type} for ${payload.email} - ${payload.success ? "SUCCESS" : "FAILURE"}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in log-auth-attempt:", error);
    // Silent failure - don't expose errors for security logging
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
