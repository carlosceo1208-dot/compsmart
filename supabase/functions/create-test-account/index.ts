import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }
  
  if (entry.count >= MAX_ATTEMPTS) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Security: Only these specific accounts are allowed
const ALLOWED_ACCOUNTS = [
  'consultor1@compsmart.ia.br',
  'consultor2@compsmart.ia.br',
  'consultor3@compsmart.ia.br'
];

// Fixed values for security
const COMPSMART_COMPANY_ID = 'b4ef7367-2068-4939-b455-f61ad9d7bc8c';
const FIXED_PASSWORD = 'Consultor@2026!';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    if (!checkRateLimit(clientIP)) {
      console.log(`[SECURITY] Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, action } = await req.json();

    // Security validation: Only allowed emails
    if (!ALLOWED_ACCOUNTS.includes(email)) {
      console.log(`[SECURITY] Unauthorized email attempt: ${email}`);
      return new Response(
        JSON.stringify({ error: 'Email not authorized for test account creation' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const accountNumber = email.replace('consultor', '').replace('@compsmart.ia.br', '');
    const fullName = `Consultor Avaliação ${accountNumber}`;

    if (action === 'create') {
      // Check if user already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, email, has_system_access')
        .eq('email', email)
        .maybeSingle();

      if (existingProfile) {
        // User exists - just update their profile
        console.log(`[INFO] Account ${email} already exists, updating profile...`);
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            has_system_access: true,
            root_company_id: COMPSMART_COMPANY_ID,
            full_name: fullName
          })
          .eq('id', existingProfile.id);

        if (updateError) {
          console.error(`[ERROR] Failed to update profile: ${updateError.message}`);
          throw updateError;
        }

        // Update role to admin
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', existingProfile.id);

        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: existingProfile.id, role: 'admin' });

        if (roleError) {
          console.error(`[ERROR] Failed to set admin role: ${roleError.message}`);
        }

        console.log(`[AUDIT] Test account updated: ${email} by IP: ${clientIP}`);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            action: 'updated',
            message: `Account ${email} updated successfully`,
            email,
            password: FIXED_PASSWORD
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create new auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: FIXED_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          root_company_id: COMPSMART_COMPANY_ID
        }
      });

      if (authError) {
        console.error(`[ERROR] Failed to create auth user: ${authError.message}`);
        throw authError;
      }

      const userId = authData.user.id;

      // Update profile with company link
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          has_system_access: true,
          root_company_id: COMPSMART_COMPANY_ID,
          full_name: fullName
        })
        .eq('id', userId);

      if (profileError) {
        console.error(`[ERROR] Failed to update profile: ${profileError.message}`);
      }

      // Set admin role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });

      if (roleError) {
        console.error(`[ERROR] Failed to set admin role: ${roleError.message}`);
      }

      console.log(`[AUDIT] Test account created: ${email} (${userId}) by IP: ${clientIP}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          action: 'created',
          message: `Account ${email} created successfully`,
          email,
          password: FIXED_PASSWORD,
          userId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ERROR] create-test-account:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
