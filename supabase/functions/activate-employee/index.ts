import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      identifier, // Pode ser employee_number ou CPF
      email,
      password
    } = await req.json();

    console.log('Activating employee account:', { identifier, email });

    // Validações
    if (!identifier) {
      throw new Error('Matrícula ou CPF é obrigatório para identificação');
    }
    if (!email) {
      throw new Error('Email é obrigatório para ativar a conta');
    }
    if (!password || password.length < 8) {
      throw new Error('Senha deve ter no mínimo 8 caracteres');
    }

    // 1. Buscar profile por employee_number OU cpf
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, cpf, employee_number, root_company_id, email, has_system_access')
      .or(`employee_number.eq.${identifier},cpf.eq.${identifier}`)
      .is('has_system_access', false) // Só perfis sem acesso ativo
      .maybeSingle();

    if (profileError) {
      console.error('Error finding profile:', profileError);
      throw new Error('Erro ao buscar cadastro');
    }

    if (!profile) {
      throw new Error('Nenhum cadastro encontrado com essa matrícula/CPF, ou a conta já foi ativada');
    }

    // 2. Verificar se já existe um Auth user com esse email
    const { data: existingUserByEmail } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .neq('id', profile.id)
      .maybeSingle();

    if (existingUserByEmail) {
      throw new Error('Este email já está em uso por outra conta');
    }

    // 3. Verificar se já existe Auth user vinculado a este profile
    // Tentar fazer login com o ID do profile para ver se existe Auth user
    const { data: authUserList } = await supabase.auth.admin.listUsers();
    const existingAuthUser = authUserList?.users?.find(u => u.id === profile.id);

    if (existingAuthUser) {
      // Já tem Auth user, apenas atualizar email e senha
      console.log('Updating existing auth user...');
      
      const { error: updateAuthError } = await supabase.auth.admin.updateUserById(
        profile.id,
        { 
          email,
          password,
          email_confirm: true
        }
      );

      if (updateAuthError) {
        console.error('Error updating auth user:', updateAuthError);
        throw new Error(`Erro ao atualizar credenciais: ${updateAuthError.message}`);
      }
    } else {
      // Não tem Auth user, criar novo vinculado ao profile existente
      console.log('Creating new auth user for existing profile...');
      
      // Como não podemos especificar o ID do Auth user, precisamos criar um novo
      // e depois atualizar o profile para usar o novo ID
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
        console.error('Error creating auth user:', authError);
        throw new Error(`Erro ao criar usuário: ${authError.message}`);
      }

      // Copiar dados do profile antigo para o novo ID
      const { data: oldProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.id)
        .single();

      if (oldProfile) {
        // Atualizar o profile recém-criado pelo trigger com os dados completos
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
          console.error('Error updating new profile:', updateNewProfileError);
        }

        // Copiar roles do profile antigo
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

        // Deletar o profile antigo (sem Auth)
        await supabase.from('user_roles').delete().eq('user_id', profile.id);
        await supabase.from('profiles').delete().eq('id', profile.id);
      }

      console.log('Account activated with new auth user');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Conta ativada com sucesso! Você já pode fazer login.',
        data: {
          userId: authData.user.id,
          email: authData.user.email
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. Atualizar profile com email e has_system_access
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        email,
        has_system_access: true
      })
      .eq('id', profile.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      throw new Error(`Erro ao atualizar perfil: ${updateError.message}`);
    }

    console.log('Account activated successfully');
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Conta ativada com sucesso! Você já pode fazer login.',
      data: updatedProfile
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in activate-employee function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
