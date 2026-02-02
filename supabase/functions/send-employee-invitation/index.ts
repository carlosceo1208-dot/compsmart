import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  employee_ids: string[];
  force_send?: boolean; // Se true, envia mesmo se já tiver acesso
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Token inválido');
    }

    // Verificar se o usuário tem permissão (Admin ou HR)
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const userRoles = roles?.map(r => r.role) || [];
    if (!userRoles.includes('admin') && !userRoles.includes('hr_manager')) {
      throw new Error('Você não tem permissão para enviar convites');
    }

    // Obter a empresa do usuário
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('root_company_id')
      .eq('id', user.id)
      .single();

    if (!userProfile?.root_company_id) {
      throw new Error('Usuário não está vinculado a uma empresa');
    }

    const { employee_ids, force_send = false }: InvitationRequest = await req.json();

    if (!employee_ids || employee_ids.length === 0) {
      throw new Error('Nenhum colaborador selecionado');
    }

    console.log(`Sending invitations to ${employee_ids.length} employees...`);

    // Buscar informações dos colaboradores selecionados
    const { data: employees, error: fetchError } = await supabase
      .from('profiles')
      .select('id, full_name, email, has_system_access, root_company_id')
      .in('id', employee_ids)
      .eq('root_company_id', userProfile.root_company_id);

    if (fetchError) {
      throw new Error(`Erro ao buscar colaboradores: ${fetchError.message}`);
    }

    if (!employees || employees.length === 0) {
      throw new Error('Nenhum colaborador encontrado');
    }

    // Buscar nome da empresa
    const { data: company } = await supabase
      .from('organizational_structure')
      .select('name')
      .eq('id', userProfile.root_company_id)
      .single();

    const companyName = company?.name || 'sua empresa';

    // Resultados do envio
    const results = {
      sent: [] as string[],
      skipped_no_email: [] as string[],
      skipped_no_access: [] as string[],
      errors: [] as { name: string; error: string }[],
    };

    // Verificar se Resend está configurado
    if (!resendApiKey) {
      throw new Error('Sistema de email não configurado. Entre em contato com o suporte.');
    }

    const resend = new Resend(resendApiKey);

    for (const employee of employees) {
      // Verificar se tem email
      if (!employee.email) {
        results.skipped_no_email.push(employee.full_name);
        continue;
      }

      // Verificar se tem acesso ao sistema (a menos que force_send)
      if (!employee.has_system_access && !force_send) {
        results.skipped_no_access.push(employee.full_name);
        continue;
      }

      try {
        // Verificar se já existe um usuário auth para este email
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const existingAuthUser = authUsers?.users?.find(u => u.email === employee.email);

        let activationUrl: string;

        if (existingAuthUser) {
          // Usuário já existe no Auth - gerar link de recuperação
          const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
            type: 'recovery',
            email: employee.email,
            options: {
              redirectTo: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/reset-password`
            }
          });

          if (resetError) {
            results.errors.push({ name: employee.full_name, error: resetError.message });
            continue;
          }

          activationUrl = resetData.properties?.action_link || '';
        } else {
          // Usuário não existe no Auth - criar conta e gerar link
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: employee.email,
            password: 'TempPass123!',
            email_confirm: true,
            user_metadata: { 
              full_name: employee.full_name,
              root_company_id: employee.root_company_id
            }
          });

          if (authError) {
            // Se o usuário já existe (possível race condition), tentar gerar link de recuperação
            if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
              const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
                type: 'recovery',
                email: employee.email,
                options: {
                  redirectTo: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/reset-password`
                }
              });

              if (resetError) {
                results.errors.push({ name: employee.full_name, error: resetError.message });
                continue;
              }

              activationUrl = resetData.properties?.action_link || '';
            } else {
              results.errors.push({ name: employee.full_name, error: authError.message });
              continue;
            }
          } else if (authData?.user) {
            // Atualizar o profile para vincular ao auth user se necessário
            await supabase
              .from('profiles')
              .update({ has_system_access: true })
              .eq('id', employee.id);

            // Gerar link de ativação
            const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
              type: 'recovery',
              email: employee.email,
              options: {
                redirectTo: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/reset-password`
              }
            });

            if (resetError) {
              results.errors.push({ name: employee.full_name, error: resetError.message });
              continue;
            }

            activationUrl = resetData.properties?.action_link || '';
          } else {
            results.errors.push({ name: employee.full_name, error: 'Erro desconhecido ao criar usuário' });
            continue;
          }
        }

        // Enviar email
        // TEMPORÁRIO: usando domínio de teste do Resend até compsmart.ia.br ser verificado
        const { error: emailError } = await resend.emails.send({
          from: 'CompSmart <onboarding@resend.dev>',
          to: [employee.email],
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
                    Olá <strong>${employee.full_name}</strong>,
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

        if (emailError) {
          results.errors.push({ name: employee.full_name, error: `Erro ao enviar email: ${emailError.message}` });
          continue;
        }

        results.sent.push(employee.full_name);
        console.log(`Invitation sent to ${employee.email}`);

      } catch (err: any) {
        results.errors.push({ name: employee.full_name, error: err.message });
      }
    }

    console.log('Invitation results:', results);

    return new Response(JSON.stringify({
      success: true,
      results,
      summary: {
        total: employee_ids.length,
        sent: results.sent.length,
        skipped_no_email: results.skipped_no_email.length,
        skipped_no_access: results.skipped_no_access.length,
        errors: results.errors.length,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in send-employee-invitation:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
