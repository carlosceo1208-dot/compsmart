import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to send welcome/invitation email
async function sendWelcomeEmail(
  email: string, 
  fullName: string, 
  companyName: string,
  activationUrl: string
) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY not configured - skipping welcome email');
    return false;
  }

  const resend = new Resend(resendApiKey);
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'CompSmart <noreply@compsmart.com.br>',
      to: [email],
      subject: `Bem-vindo(a) ao CompSmart - ${companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">
                🎉 Bem-vindo(a) ao CompSmart!
              </h1>
            </div>
            
            <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                Olá <strong>${fullName}</strong>,
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                Você foi cadastrado(a) como colaborador(a) na empresa <strong>${companyName}</strong> no sistema CompSmart.
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                Para acessar a plataforma, você precisa definir sua senha clicando no botão abaixo:
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${activationUrl}" 
                   style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); 
                          color: white; 
                          padding: 16px 32px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: 600;
                          font-size: 16px;
                          display: inline-block;
                          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
                  🔐 Ativar Minha Conta
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-top: 24px;">
                <strong>Importante:</strong> Este link expira em 24 horas. Se expirar, você pode solicitar um novo link na página de login.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              
              <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                Se você não esperava este email, pode ignorá-lo com segurança.<br>
                CompSmart - Gestão Inteligente de Remuneração
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return false;
    }

    console.log('Welcome email sent successfully:', data?.id);
    return true;
  } catch (err) {
    console.error('Error sending welcome email:', err);
    return false;
  }
}

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
      email, 
      full_name, 
      employee_number,
      phone,
      cpf,
      birth_date,
      hire_date,
      termination_date,
      job_title,
      job_title_id,
      grade,
      salary,
      variable_salary,
      salary_range_percentage,
      performance_rating,
      unit_id,
      manager_id,
      has_system_access,
      root_company_id,
      roles = ['employee']
    } = await req.json();

    console.log('Creating/updating employee:', { email, employee_number, root_company_id, hasEmail: !!email });

    // Validação: employee_number é obrigatório
    if (!employee_number) {
      throw new Error('Número de Registro (Matrícula) é obrigatório');
    }

    // 1. Validar employee_number se fornecido
    const { data: existingRE, error: checkError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('employee_number', employee_number)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking employee_number:', checkError);
      throw new Error(`Erro ao validar número de registro: ${checkError.message}`);
    }
    
    // Se já existe com email diferente (ou sem email e está criando com email)
    if (existingRE && email && existingRE.email !== email) {
      throw new Error(`Número de Registro ${employee_number} já está em uso`);
    }

    // Se já existe esse employee_number, atualizar
    if (existingRE) {
      console.log('Updating existing profile by employee_number:', existingRE.id);
      
      const profileData: Record<string, any> = {
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
        unit_id: unit_id || null,
        manager_id: manager_id || null,
        root_company_id: root_company_id || null,
        has_system_access: email ? (has_system_access ?? true) : false,
      };

      // Se está adicionando email a um perfil existente sem email
      if (email && !existingRE.email) {
        profileData.email = email;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', existingRE.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating profile:', error);
        throw new Error(`Erro ao atualizar perfil: ${error.message}`);
      }

      // Atualizar roles
      if (roles && roles.length > 0) {
        // Remover roles existentes
        await supabase.from('user_roles').delete().eq('user_id', existingRE.id);
        
        // Adicionar novos roles
        for (const role of roles) {
          await supabase.from('user_roles').insert({
            user_id: existingRE.id,
            role
          });
        }
      }

      console.log('Profile updated successfully');
      return new Response(JSON.stringify({ 
        success: true, 
        data,
        action: 'updated'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Verificar se usuário já existe por email (se email fornecido)
    if (email) {
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (profileCheckError) {
        console.error('Error checking existing profile:', profileCheckError);
        throw new Error(`Erro ao verificar perfil existente: ${profileCheckError.message}`);
      }

      if (existingProfile) {
        // UPDATE perfil existente por email
        console.log('Updating existing profile by email:', existingProfile.id);
        
        const profileData = {
          full_name,
          employee_number,
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
          unit_id: unit_id || null,
          manager_id: manager_id || null,
          root_company_id: root_company_id || null,
          has_system_access: has_system_access ?? true,
        };

        const { data, error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', existingProfile.id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating profile:', error);
          throw new Error(`Erro ao atualizar perfil: ${error.message}`);
        }

        // Atualizar roles
        if (roles && roles.length > 0) {
          await supabase.from('user_roles').delete().eq('user_id', existingProfile.id);
          for (const role of roles) {
            await supabase.from('user_roles').insert({
              user_id: existingProfile.id,
              role
            });
          }
        }

        console.log('Profile updated successfully');
        return new Response(JSON.stringify({ 
          success: true, 
          data,
          action: 'updated'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 3. CREATE novo usuário
    if (email) {
      // Criar com Auth User (tem email)
      console.log('Creating new user account with email...');
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: 'TempPass123!', // Senha temporária
        email_confirm: true,
        user_metadata: { 
          full_name,
          root_company_id 
        }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        throw new Error(`Erro ao criar usuário: ${authError.message}`);
      }

      console.log('Auth user created, updating profile...');

      const profileData = {
        full_name,
        employee_number,
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
        unit_id: unit_id || null,
        manager_id: manager_id || null,
        root_company_id: root_company_id || null,
        has_system_access: has_system_access ?? true,
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', authData.user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating new profile:', error);
        throw new Error(`Erro ao atualizar perfil do novo usuário: ${error.message}`);
      }

      // Atribuir roles
      if (roles && roles.length > 0) {
        for (const role of roles) {
          await supabase.from('user_roles').insert({
            user_id: authData.user.id,
            role
          });
        }
      }

      // NÃO ENVIAR EMAIL AUTOMATICAMENTE
      // O Admin/RH deve disparar manualmente via botão "Enviar Convite"
      console.log('New employee with email created successfully (no automatic email - awaiting manual invitation)');
      
      return new Response(JSON.stringify({ 
        success: true, 
        data,
        action: 'created',
        emailSent: false,
        message: 'Colaborador criado. Use o botão "Enviar Convite" para enviar o email de ativação.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      // Criar apenas Profile SEM Auth User (não tem email)
      console.log('Creating profile-only employee (no email)...');
      
      const newId = crypto.randomUUID();
      
      const profileData = {
        id: newId,
        full_name,
        email: null,
        employee_number,
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
        unit_id: unit_id || null,
        manager_id: manager_id || null,
        root_company_id: root_company_id || null,
        has_system_access: false, // Sem email = sem acesso ao sistema
        status: termination_date ? 'inactive' : 'active'
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('Error creating profile-only employee:', error);
        throw new Error(`Erro ao criar perfil do funcionário: ${error.message}`);
      }

      // Atribuir roles (mesmo sem Auth, pode ter role para referência)
      if (roles && roles.length > 0) {
        for (const role of roles) {
          await supabase.from('user_roles').insert({
            user_id: newId,
            role
          });
        }
      }

      console.log('Profile-only employee created successfully');
      return new Response(JSON.stringify({ 
        success: true, 
        data,
        action: 'created_without_auth',
        message: 'Funcionário criado sem acesso ao sistema. Poderá ativar conta posteriormente.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error: any) {
    console.error('Error in create-employee-user function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
