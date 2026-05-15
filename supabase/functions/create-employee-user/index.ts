import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SECURITY: roles a non-super-admin caller can ever assign
const ALLOWED_ROLES = new Set(['employee', 'manager', 'hr_manager', 'admin']);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // ============= SECURITY: Authenticate caller =============
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.replace('Bearer ', '');

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsErr } = await supabaseUser.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ success: false, error: 'Sessão inválida' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const callerId = claimsData.claims.sub as string;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // SECURITY: Verify caller is admin or hr_manager
    const { data: callerRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId);
    const roles = (callerRoles ?? []).map((r) => r.role);
    const isAdmin = roles.includes('admin') || roles.includes('super_admin');
    const isHr = roles.includes('hr_manager');
    if (!isAdmin && !isHr) {
      return new Response(JSON.stringify({ success: false, error: 'Permissão negada' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // SECURITY: Force company scope to caller's own company
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('root_company_id')
      .eq('id', callerId)
      .single();
    const callerCompanyId = callerProfile?.root_company_id;
    if (!callerCompanyId) {
      return new Response(JSON.stringify({ success: false, error: 'Empresa não vinculada' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const {
      email, full_name, employee_number, phone, cpf, birth_date, hire_date, termination_date,
      job_title, job_title_id, grade, salary, variable_salary, salary_range_percentage,
      performance_rating, work_modality, unit_id, manager_id, has_system_access,
    } = body;
    const requestedRoles: string[] = Array.isArray(body.roles) ? body.roles : ['employee'];

    if (!employee_number) {
      return new Response(JSON.stringify({ success: false, error: 'Matrícula obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // SECURITY: Sanitize requested roles. Block super_admin from being assigned via API.
    const sanitizedRoles = requestedRoles.filter((r) => ALLOWED_ROLES.has(r));
    if (sanitizedRoles.length === 0) sanitizedRoles.push('employee');

    // SECURITY: Force the new profile to caller's company - never trust client value.
    const root_company_id = callerCompanyId;

    console.log('[create-employee-user] caller', callerId, 'creating', employee_number);

    // 1. Check existing employee_number
    const { data: existingRE, error: checkError } = await supabase
      .from('profiles')
      .select('id, email, root_company_id')
      .eq('employee_number', employee_number)
      .maybeSingle();
    if (checkError) throw new Error(`Erro ao validar matrícula: ${checkError.message}`);

    // SECURITY: prevent cross-tenant edits
    if (existingRE && existingRE.root_company_id && existingRE.root_company_id !== callerCompanyId) {
      return new Response(JSON.stringify({ success: false, error: 'Matrícula pertence a outra empresa' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (existingRE && email && existingRE.email && existingRE.email !== email) {
      return new Response(JSON.stringify({ success: false, error: `Matrícula ${employee_number} já está em uso` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const buildProfileData = (extra: Record<string, any> = {}) => ({
      full_name,
      phone: phone || null,
      cpf: cpf || null,
      birth_date: birth_date || null,
      hire_date: hire_date || null,
      termination_date: termination_date || null,
      job_title: job_title || null,
      job_title_id: job_title_id || null,
      grade: grade || null,
      salary: salary || null,
      variable_salary: variable_salary || null,
      salary_range_percentage: salary_range_percentage || null,
      performance_rating: performance_rating || null,
      work_modality: work_modality || null,
      unit_id: unit_id || null,
      manager_id: manager_id || null,
      root_company_id,
      has_system_access: email ? (has_system_access ?? true) : false,
      ...extra,
    });

    const replaceRoles = async (userId: string) => {
      await supabase.from('user_roles').delete().eq('user_id', userId);
      for (const role of sanitizedRoles) {
        await supabase.from('user_roles').insert({ user_id: userId, role });
      }
    };

    if (existingRE) {
      const profileData = buildProfileData(email && !existingRE.email ? { email } : {});
      const { data, error } = await supabase
        .from('profiles').update(profileData).eq('id', existingRE.id).select().single();
      if (error) throw new Error(`Erro ao atualizar perfil: ${error.message}`);
      await replaceRoles(existingRE.id);
      return new Response(JSON.stringify({ success: true, data, action: 'updated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check by email
    if (email) {
      const { data: existingProfile } = await supabase
        .from('profiles').select('id, root_company_id').eq('email', email).maybeSingle();
      if (existingProfile && existingProfile.root_company_id && existingProfile.root_company_id !== callerCompanyId) {
        return new Response(JSON.stringify({ success: false, error: 'Email pertence a outra empresa' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (existingProfile) {
        const profileData = buildProfileData({ employee_number });
        const { data, error } = await supabase
          .from('profiles').update(profileData).eq('id', existingProfile.id).select().single();
        if (error) throw new Error(`Erro ao atualizar perfil: ${error.message}`);
        await replaceRoles(existingProfile.id);
        return new Response(JSON.stringify({ success: true, data, action: 'updated' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // CREATE
    if (email) {
      // SECURITY: Strong random password; user must set their own via the invitation flow.
      const randomPassword = crypto.randomUUID() + crypto.randomUUID() + 'Aa1!';
      // email_confirm: true to bypass SMTP confirmation step (which was returning 500
      // when the project's transactional email isn't configured for the verify endpoint).
      // The user still cannot log in until they set a password via the invitation flow.
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: randomPassword,
        email_confirm: true,
        user_metadata: { full_name, root_company_id },
      });
      if (authError) throw new Error(`Erro ao criar usuário: ${authError.message}`);

      const profileData = buildProfileData({ employee_number });
      const { data, error } = await supabase
        .from('profiles').update(profileData).eq('id', authData.user.id).select().single();
      if (error) throw new Error(`Erro ao atualizar perfil: ${error.message}`);
      await replaceRoles(authData.user.id);

      return new Response(JSON.stringify({
        success: true, data, action: 'created', emailSent: false,
        message: 'Colaborador criado. Use "Enviar Convite" para o email de ativação.',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Profile-only (no email)
    const newId = crypto.randomUUID();
    const profileData = {
      id: newId, email: null, employee_number,
      ...buildProfileData(),
      has_system_access: false,
      status: termination_date ? 'inactive' : 'active',
    };
    const { data, error } = await supabase.from('profiles').insert(profileData).select().single();
    if (error) throw new Error(`Erro ao criar perfil: ${error.message}`);
    await replaceRoles(newId);
    return new Response(JSON.stringify({
      success: true, data, action: 'created_without_auth',
      message: 'Colaborador criado sem acesso ao sistema.',
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('[create-employee-user] error:', error?.message, error);
    return new Response(JSON.stringify({ success: false, error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
