import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TurnstileResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      console.error("[verify-turnstile] Missing token in request");
      return new Response(
        JSON.stringify({ success: false, error: "Token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const secretKey = Deno.env.get("TURNSTILE_SECRET_KEY");
    if (!secretKey) {
      console.error("[verify-turnstile] TURNSTILE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get client IP from headers
    const clientIp = req.headers.get("cf-connecting-ip") || 
                     req.headers.get("x-forwarded-for")?.split(",")[0] || 
                     "unknown";

    console.log(`[verify-turnstile] Verifying token for IP: ${clientIp}`);

    // Verify with Cloudflare
    const verifyResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
          remoteip: clientIp,
        }),
      }
    );

    const result: TurnstileResponse = await verifyResponse.json();

    console.log(`[verify-turnstile] Cloudflare response: success=${result.success}, errors=${JSON.stringify(result["error-codes"] || [])}`);

    if (result.success) {
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "CAPTCHA verification failed",
          codes: result["error-codes"] 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("[verify-turnstile] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
