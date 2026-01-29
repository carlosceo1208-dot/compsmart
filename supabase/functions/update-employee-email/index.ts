import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface UpdateEmailRequest {
  targetUserId: string;
  newEmail: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create admin client for privileged operations (moved up for token verification)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify user token using getUser (stable API)
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const callerId = user.id;

    // Parse request body
    const { targetUserId, newEmail }: UpdateEmailRequest = await req.json();

    // Validate inputs
    if (!targetUserId || !newEmail) {
      return new Response(
        JSON.stringify({ error: 'userId e newEmail são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return new Response(
        JSON.stringify({ error: 'Formato de email inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limiting (5 changes per hour)
    const { data: rateLimitOk } = await supabaseAdmin.rpc('check_rate_limit', {
      p_user_id: callerId,
      p_function_name: 'update-employee-email',
      p_max_requests: 5,
      p_window_minutes: 60
    });

    if (rateLimitOk === false) {
      return new Response(
        JSON.stringify({ error: 'Limite de alterações de email excedido. Tente novamente em 1 hora.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get caller's profile and roles
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('root_company_id')
      .eq('id', callerId)
      .single();

    const { data: callerRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId);

    const roles = callerRoles?.map(r => r.role) || [];
    const isAdmin = roles.includes('admin');
    const isHR = roles.includes('hr_manager');
    const isSelf = callerId === targetUserId;

    // Get target profile
    const { data: targetProfile, error: targetError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, root_company_id')
      .eq('id', targetUserId)
      .single();

    if (targetError || !targetProfile) {
      return new Response(
        JSON.stringify({ error: 'Funcionário não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Permission check
    if (!isSelf) {
      // If not self, must be admin/HR from same company
      if (!isAdmin && !isHR) {
        return new Response(
          JSON.stringify({ error: 'Apenas Admin ou RH podem alterar email de outros funcionários' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify same company
      if (callerProfile?.root_company_id !== targetProfile.root_company_id) {
        return new Response(
          JSON.stringify({ error: 'Você só pode alterar funcionários da sua empresa' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check if email is already in use WITHIN THE SAME COMPANY (multi-tenant isolation for profiles)
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, root_company_id')
      .eq('email', newEmail.toLowerCase())
      .neq('id', targetUserId)
      .maybeSingle();

    // Only block if the existing profile belongs to the SAME company
    if (existingProfile && existingProfile.root_company_id === targetProfile.root_company_id) {
      return new Response(
        JSON.stringify({ error: `Este email já está em uso por: ${existingProfile.full_name}` }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // IMPORTANT: Check if email exists in auth.users (global constraint)
    // auth.users has a unique constraint on email - we cannot have duplicate emails there
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1 });
    // Use a direct query to check for the email
    const { data: existingAuthUser } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .eq('email', newEmail.toLowerCase())
      .neq('id', targetUserId)
      .maybeSingle();
    
    // If email exists in another user's profile (any company) and that user has auth access,
    // we need to check if they have an auth.users entry
    if (existingAuthUser) {
      const { data: authCheck } = await supabaseAdmin.auth.admin.getUserById(existingAuthUser.id);
      if (authCheck?.user) {
        return new Response(
          JSON.stringify({ 
            error: `Este email já está vinculado a outra conta de acesso no sistema. Cada email de login deve ser único.` 
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check if target has an auth.users entry
    const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(targetUserId);

    if (authUserError || !authUser?.user) {
      // User doesn't have auth entry - just update profiles table
      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({ email: newEmail.toLowerCase() })
        .eq('id', targetUserId);

      if (profileUpdateError) {
        console.error('Profile update error:', profileUpdateError);
        return new Response(
          JSON.stringify({ error: 'Erro ao atualizar email no perfil' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log to audit
      await supabaseAdmin.from('audit_logs').insert({
        user_id: callerId,
        table_name: 'profiles',
        action: 'email_change',
        record_id: targetUserId,
        old_data: { email: targetProfile.email },
        new_data: { email: newEmail.toLowerCase(), note: 'profile_only' }
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email atualizado com sucesso (apenas perfil)' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // User has auth entry - update both auth.users and profiles
    const oldEmail = authUser.user.email;

    // Update auth.users
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUserId,
      { email: newEmail.toLowerCase() }
    );

    if (authUpdateError) {
      console.error('Auth update error:', authUpdateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar email na autenticação: ' + authUpdateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update profiles table
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ email: newEmail.toLowerCase() })
      .eq('id', targetUserId);

    if (profileUpdateError) {
      // Try to rollback auth change
      console.error('Profile update error, attempting rollback:', profileUpdateError);
      await supabaseAdmin.auth.admin.updateUserById(targetUserId, { email: oldEmail });
      
      return new Response(
        JSON.stringify({ error: 'Erro ao sincronizar email. Alteração revertida.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log to audit
    await supabaseAdmin.from('audit_logs').insert({
      user_id: callerId,
      table_name: 'profiles',
      action: 'email_change',
      record_id: targetUserId,
      old_data: { email: oldEmail },
      new_data: { email: newEmail.toLowerCase(), auth_updated: true }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email atualizado com sucesso! O funcionário deve usar o novo email para login.' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
