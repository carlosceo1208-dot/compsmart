import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= SECURITY: Rate Limiting =============
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_ATTEMPTS = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  // Clean old entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= MAX_ATTEMPTS) {
    return false;
  }
  
  record.count++;
  return true;
}

// ============= SECURITY: Input Sanitization (Hardened) =============
function sanitizeIdentifier(input: string): string {
  if (!input || typeof input !== 'string') return '';
  // SECURITY: Only allow alphanumeric characters - NO dots, hyphens, or special chars
  // This prevents any SQL injection attempts
  return input.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
}

function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') return '';
  const cleaned = input.toLowerCase().trim().substring(0, 255);
  // SECURITY: Validate email format with regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(cleaned) ? cleaned : '';
}

function isValidCPF(input: string): boolean {
  // SECURITY: CPF must be exactly 11 numeric digits
  return /^\d{11}$/.test(input);
}

function isValidEmployeeNumber(input: string): boolean {
  // SECURITY: Employee number - alphanumeric, 1-20 chars
  return /^[a-zA-Z0-9]{1,20}$/.test(input);
}

// Generic error message to prevent enumeration
const GENERIC_ERROR = 'Não foi possível processar sua solicitação. Verifique os dados e tente novamente.';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // SECURITY: Get client IP for rate limiting
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   req.headers.get('x-real-ip') || 
                   'unknown';

  // SECURITY: Check rate limit
  if (!checkRateLimit(clientIP)) {
    console.warn('Rate limit exceeded for activation attempt');
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.'
    }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const turnstileSecretKey = Deno.env.get('TURNSTILE_SECRET_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestBody = await req.json();
    
    // SECURITY: Sanitize inputs
    const identifier = sanitizeIdentifier(requestBody.identifier);
    const email = sanitizeEmail(requestBody.email);
    const password = requestBody.password;
    const turnstileToken = requestBody.turnstileToken;

    // Log without sensitive data
    console.log('Activation attempt received');

    // SECURITY: Turnstile CAPTCHA is REQUIRED unconditionally
    if (!turnstileSecretKey) {
      console.error('[SECURITY] TURNSTILE_SECRET_KEY not configured - blocking activation');
      return new Response(JSON.stringify({
        success: false,
        error: 'Serviço de ativação temporariamente indisponível.'
      }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!turnstileToken) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Verificação de segurança necessária. Por favor, complete o captcha.'
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    try {
      const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: turnstileSecretKey,
          response: turnstileToken,
          remoteip: clientIP
        })
      });
      const turnstileResult = await turnstileResponse.json();
      if (!turnstileResult.success) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Verificação de segurança falhou. Por favor, tente novamente.'
        }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    } catch (_e) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Falha na verificação de segurança. Tente novamente.'
      }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // SECURITY: Audit log all activation attempts
    try {
      await supabase.from('auth_attempt_logs').insert({
        email: email || 'unknown',
        attempt_type: 'signup',
        success: false, // updated to true at end if successful
        ip_address: clientIP,
        user_agent: req.headers.get('user-agent') || 'unknown',
        metadata: { source: 'activate-employee', identifier_present: !!identifier }
      });
    } catch (_e) { /* non-blocking */ }

    // Validations with generic messages
    if (!identifier || (!isValidCPF(identifier) && !isValidEmployeeNumber(identifier))) {
      return new Response(JSON.stringify({ 
        success: false,
        error: GENERIC_ERROR
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!email) {
      return new Response(JSON.stringify({ 
        success: false,
        error: GENERIC_ERROR
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!password || password.length < 10) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Senha deve ter no mínimo 10 caracteres'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // SECURITY: Use SEPARATE queries to avoid string interpolation in filters
    // This completely prevents SQL injection by never concatenating user input
    let profile = null;

    // First try employee_number with parameterized query
    const { data: profileByNumber, error: error1 } = await supabase
      .from('profiles')
      .select('id, full_name, cpf, employee_number, root_company_id, email, has_system_access')
      .eq('employee_number', identifier)
      .is('has_system_access', false)
      .maybeSingle();

    if (!error1 && profileByNumber) {
      profile = profileByNumber;
    } else {
      // Then try CPF with parameterized query
      const { data: profileByCpf, error: error2 } = await supabase
        .from('profiles')
        .select('id, full_name, cpf, employee_number, root_company_id, email, has_system_access')
        .eq('cpf', identifier)
        .is('has_system_access', false)
        .maybeSingle();
      
      if (!error2 && profileByCpf) {
        profile = profileByCpf;
      }
    }

    // SECURITY: Generic error - don't reveal if profile exists or not
    if (!profile) {
      return new Response(JSON.stringify({ 
        success: false,
        error: GENERIC_ERROR
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if email is already in use WITHIN THE SAME COMPANY (multi-tenant isolation)
    const { data: existingUserByEmail } = await supabase
      .from('profiles')
      .select('id, root_company_id')
      .eq('email', email)
      .neq('id', profile.id)
      .maybeSingle();

    // Only block if the existing profile belongs to the SAME company
    if (existingUserByEmail && existingUserByEmail.root_company_id === profile.root_company_id) {
      return new Response(JSON.stringify({ 
        success: false,
        error: GENERIC_ERROR
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if auth user already exists for this profile
    const { data: authUserList } = await supabase.auth.admin.listUsers();
    const existingAuthUser = authUserList?.users?.find(u => u.id === profile.id);

    if (existingAuthUser) {
      // Update existing auth user
      console.log('Updating existing auth user');
      
      const { error: updateAuthError } = await supabase.auth.admin.updateUserById(
        profile.id,
        { 
          email,
          password,
          email_confirm: true
        }
      );

      if (updateAuthError) {
        console.error('Error updating auth user');
        return new Response(JSON.stringify({ 
          success: false,
          error: GENERIC_ERROR
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else {
      // Create new auth user
      console.log('Creating new auth user for profile');
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { 
          full_name: profile.full_name,
          root_company_id: profile.root_company_id 
        }
      });

      if (authError) {
        console.error('Error creating auth user');
        return new Response(JSON.stringify({ 
          success: false,
          error: GENERIC_ERROR
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Copy data from old profile to new auth user profile
      const { data: oldProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.id)
        .single();

      if (oldProfile) {
        const { error: updateNewProfileError } = await supabase
          .from('profiles')
          .update({
            employee_number: oldProfile.employee_number,
            phone: oldProfile.phone,
            cpf: oldProfile.cpf,
            birth_date: oldProfile.birth_date,
            job_title: oldProfile.job_title,
            job_title_id: oldProfile.job_title_id,
            grade: oldProfile.grade,
            salary: oldProfile.salary,
            variable_salary: oldProfile.variable_salary,
            salary_range_percentage: oldProfile.salary_range_percentage,
            performance_rating: oldProfile.performance_rating,
            unit_id: oldProfile.unit_id,
            manager_id: oldProfile.manager_id,
            root_company_id: oldProfile.root_company_id,
            has_system_access: true,
            benefits_value: oldProfile.benefits_value,
            short_term_incentive: oldProfile.short_term_incentive,
            long_term_incentive: oldProfile.long_term_incentive,
          })
          .eq('id', authData.user.id);

        if (updateNewProfileError) {
          console.error('Error updating new profile');
        }

        // Copy roles from old profile
        const { data: oldRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profile.id);

        if (oldRoles && oldRoles.length > 0) {
          for (const roleData of oldRoles) {
            await supabase.from('user_roles').insert({
              user_id: authData.user.id,
              role: roleData.role
            });
          }
        }

        // Delete old profile (without Auth)
        await supabase.from('user_roles').delete().eq('user_id', profile.id);
        await supabase.from('profiles').delete().eq('id', profile.id);
      }

      console.log('Account activated successfully');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Conta ativada com sucesso! Você já pode fazer login.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update profile with email and has_system_access
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        email,
        has_system_access: true
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Error updating profile');
      return new Response(JSON.stringify({ 
        success: false,
        error: GENERIC_ERROR
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Account activated successfully');
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Conta ativada com sucesso! Você já pode fazer login.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Activation error occurred');
    return new Response(JSON.stringify({ 
      success: false,
      error: GENERIC_ERROR
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
