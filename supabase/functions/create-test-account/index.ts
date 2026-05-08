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
// SECURITY: Password is loaded from env secret, never hardcoded.
const FIXED_PASSWORD = Deno.env.get('TEST_ACCOUNT_PASSWORD') ?? '';

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

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

    if (!FIXED_PASSWORD) {
      console.error('[SECURITY] TEST_ACCOUNT_PASSWORD secret not configured');
      return json({ error: 'Service not configured' }, 503);
    }

    const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);

    if (claimsError || !claimsData?.claims?.sub) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const callerId = claimsData.claims.sub as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: callerRoles, error: roleLookupError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId);

    if (roleLookupError) {
      console.error('[SECURITY] Failed to load caller roles:', roleLookupError.message);
      return json({ error: 'Authorization check failed' }, 500);
    }

    const isSuperAdmin = (callerRoles ?? []).some(({ role }) => role === 'super_admin');
    if (!isSuperAdmin) {
      return json({ error: 'Forbidden' }, 403);
    }

    const body = await req.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const action = typeof body?.action === 'string' ? body.action : '';

    if (action !== 'create') {
      return json({ error: 'Invalid action' }, 400);
    }

    // Security validation: Only allowed emails
    if (!ALLOWED_ACCOUNTS.includes(email)) {
      console.log(`[SECURITY] Unauthorized email attempt: ${email}`);
      return json({ error: 'Email not authorized for test account creation' }, 403);
    }

    const accountNumber = email.replace('consultor', '').replace('@compsmart.ia.br', '');
    const fullName = `Consultor Avaliação ${accountNumber}`;

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

      console.log(`[AUDIT] Test account updated: ${email} by IP: ${clientIP} by caller: ${callerId}`);
      
      return json({ 
        success: true, 
        action: 'updated',
        message: `Account ${email} updated successfully. Use the configured shared credential to sign in.`,
        email
      });
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

    return json({ 
      success: true, 
      action: 'created',
      message: `Account ${email} created successfully. Use the configured shared credential to sign in.`,
      email,
      userId
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ERROR] create-test-account:', errorMessage);
    return json({ error: errorMessage }, 500);
  }
});
