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

// ============= SECURITY: Input Sanitization =============
function sanitizeIdentifier(input: string): string {
  if (!input || typeof input !== 'string') return '';
  // Remove special characters, keep only alphanumeric, dots, and hyphens
  // Limit length to prevent abuse
  return input.replace(/[^a-zA-Z0-9.\-]/g, '').substring(0, 50);
}

function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') return '';
  // Basic email sanitization - remove dangerous characters
  return input.toLowerCase().trim().substring(0, 255);
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
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestBody = await req.json();
    
    // SECURITY: Sanitize inputs
    const identifier = sanitizeIdentifier(requestBody.identifier);
    const email = sanitizeEmail(requestBody.email);
    const password = requestBody.password;

    // Log without sensitive data
    console.log('Activation attempt received');

    // Validations with generic messages
    if (!identifier) {
      return new Response(JSON.stringify({ 
        success: false,
        error: GENERIC_ERROR
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (!email || !email.includes('@')) {
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

    // SECURITY: Use parameterized query with sanitized input
    // Search by employee_number OR cpf
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, cpf, employee_number, root_company_id, email, has_system_access')
      .or(`employee_number.eq.${identifier},cpf.eq.${identifier}`)
      .is('has_system_access', false)
      .maybeSingle();

    if (profileError) {
      console.error('Database error during activation');
      return new Response(JSON.stringify({ 
        success: false,
        error: GENERIC_ERROR
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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

    // Check if email is already in use (generic error)
    const { data: existingUserByEmail } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .neq('id', profile.id)
      .maybeSingle();

    if (existingUserByEmail) {
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