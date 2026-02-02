import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getDeletionConfirmationEmail = (data: Record<string, any>): { subject: string; html: string } => {
  const baseStyles = `
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; }
      .container { max-width: 600px; margin: 0 auto; background: white; }
      .header { background: linear-gradient(135deg, #52525b 0%, #3f3f46 100%); padding: 40px 30px; text-align: center; }
      .header h1 { color: white; margin: 0; font-size: 28px; }
      .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0; }
      .content { padding: 40px 30px; }
      .content h2 { color: #18181b; margin-top: 0; }
      .content p { color: #52525b; line-height: 1.6; }
      .info-box { background: #f4f4f5; border-radius: 8px; padding: 20px; margin: 20px 0; }
      .info-box h3 { margin-top: 0; color: #18181b; }
      .info-box p { color: #52525b; margin-bottom: 0; }
      .button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; font-size: 16px; }
      .footer { background: #18181b; padding: 30px; text-align: center; }
      .footer p { color: #a1a1aa; font-size: 12px; margin: 5px 0; }
      .footer a { color: #a1a1aa; }
    </style>
  `;

  const footer = `
    <div class="footer">
      <p><strong>CompSmart</strong> - Gestão Inteligente em Remuneração</p>
      <p>Este email foi enviado automaticamente. Por favor, não responda.</p>
      <p>Em conformidade com a LGPD | <a href="https://compsmart.ia.br/privacy">Política de Privacidade</a></p>
    </div>
  `;

  return {
    subject: `Confirmação: Seus dados do CompSmart foram excluídos`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>${baseStyles}</head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Dados Excluídos</h1>
            <p>Confirmação de exclusão de conta</p>
          </div>
          <div class="content">
            <h2>Olá, ${data.userName}!</h2>
            <p>Conforme informado, os dados da empresa <strong>${data.companyName}</strong> foram permanentemente excluídos do CompSmart.</p>
            
            <div class="info-box">
              <h3>📋 O que foi excluído:</h3>
              <p>
                • Todos os perfis de colaboradores<br>
                • Tabelas salariais e faixas<br>
                • Cargos e estrutura organizacional<br>
                • Histórico de conversas com assistentes IA<br>
                • Configurações e preferências
              </p>
            </div>
            
            <p>Sentiremos sua falta! Se você mudar de ideia, estamos sempre aqui para ajudá-lo com sua gestão de remuneração.</p>
            
            <center>
              <a href="https://compsmart.ia.br" class="button">Conhecer o CompSmart Novamente</a>
            </center>
            
            <p style="font-size: 14px; color: #71717a;">
              Dúvidas? Entre em contato: suporte@compsmart.ia.br
            </p>
          </div>
          ${footer}
        </div>
      </body>
      </html>
    `
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting expired data deletion...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();

    // Find companies with expired data_deletion_scheduled_at
    const { data: expiredCompanies, error } = await supabase
      .from('organizational_structure')
      .select(`
        id,
        name,
        billing_email,
        data_deletion_scheduled_at
      `)
      .eq('subscription_status', 'expired')
      .not('data_deletion_scheduled_at', 'is', null)
      .lt('data_deletion_scheduled_at', now.toISOString());

    if (error) {
      console.error('Error fetching expired companies:', error);
      throw error;
    }

    console.log(`Found ${expiredCompanies?.length || 0} companies to delete`);

    let deleted = 0;
    let emailsSent = 0;
    const results: any[] = [];

    for (const company of expiredCompanies || []) {
      console.log(`Processing deletion for company ${company.id}: ${company.name}`);

      // Get admin info before deletion for email notification
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('root_company_id', company.id)
        .limit(1)
        .single();

      const adminEmail = company.billing_email || adminProfile?.email;
      const adminName = adminProfile?.full_name || 'Cliente';

      try {
        // Get all profile IDs for this company first
        const { data: companyProfiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('root_company_id', company.id);

        const profileIds = companyProfiles?.map(p => p.id) || [];
        console.log(`Found ${profileIds.length} profiles to delete for company ${company.id}`);

        if (profileIds.length > 0) {
          // 1. Delete employee benefits
          await supabase
            .from('employee_benefits')
            .delete()
            .in('employee_id', profileIds);

          // 2. Delete employee incentive assignments
          await supabase
            .from('employee_incentive_assignments')
            .delete()
            .in('employee_id', profileIds);

          // 3. Delete conversation sessions and messages
          await supabase
            .from('salary_assistant_conversations')
            .delete()
            .in('user_id', profileIds);

          await supabase
            .from('legal_assistant_conversations')
            .delete()
            .in('user_id', profileIds);

          await supabase
            .from('incentive_assistant_conversations')
            .delete()
            .in('user_id', profileIds);

          // Delete user roles
          await supabase
            .from('user_roles')
            .delete()
            .in('user_id', profileIds);
        }

        // 4. Delete conversation sessions
        await supabase
          .from('conversation_sessions')
          .delete()
          .eq('root_company_id', company.id);

        // 5. Get benefit IDs for this company
        const { data: companyBenefits } = await supabase
          .from('benefits')
          .select('id')
          .eq('root_company_id', company.id);

        const benefitIds = companyBenefits?.map(b => b.id) || [];

        if (benefitIds.length > 0) {
          // Delete benefit eligibility rules
          await supabase
            .from('benefit_eligibility_rules')
            .delete()
            .in('benefit_id', benefitIds);

          // Delete benefit eligibility
          await supabase
            .from('benefit_eligibility')
            .delete()
            .in('benefit_id', benefitIds);
        }

        // Delete benefits
        await supabase
          .from('benefits')
          .delete()
          .eq('root_company_id', company.id);

        // 6. Get incentive program IDs
        const { data: companyPrograms } = await supabase
          .from('incentive_programs')
          .select('id')
          .eq('root_company_id', company.id);

        const programIds = companyPrograms?.map(p => p.id) || [];

        if (programIds.length > 0) {
          // Delete incentive eligibility
          await supabase
            .from('incentive_eligibility')
            .delete()
            .in('program_id', programIds);
        }

        // Delete incentive programs
        await supabase
          .from('incentive_programs')
          .delete()
          .eq('root_company_id', company.id);

        // 7. Get job title IDs
        const { data: companyJobTitles } = await supabase
          .from('job_titles')
          .select('id')
          .eq('root_company_id', company.id);

        const jobTitleIds = companyJobTitles?.map(j => j.id) || [];

        if (jobTitleIds.length > 0) {
          // Delete job title competencies
          await supabase
            .from('job_title_competencies')
            .delete()
            .in('job_title_id', jobTitleIds);
        }

        // Delete job titles
        await supabase
          .from('job_titles')
          .delete()
          .eq('root_company_id', company.id);

        // 8. Get salary table IDs
        const { data: companySalaryTables } = await supabase
          .from('salary_tables')
          .select('id')
          .eq('root_company_id', company.id);

        const salaryTableIds = companySalaryTables?.map(s => s.id) || [];

        if (salaryTableIds.length > 0) {
          // Delete salary ranges
          await supabase
            .from('salary_ranges')
            .delete()
            .in('salary_table_id', salaryTableIds);
        }

        // Delete salary tables
        await supabase
          .from('salary_tables')
          .delete()
          .eq('root_company_id', company.id);

        // 9. Delete budget data
        await supabase
          .from('budget_employee_projections')
          .delete()
          .eq('created_by', profileIds[0] || '00000000-0000-0000-0000-000000000000');

        await supabase
          .from('collective_salary_adjustments')
          .delete()
          .eq('root_company_id', company.id);

        // 10. Delete alerts
        await supabase
          .from('alert_history')
          .delete()
          .eq('root_company_id', company.id);

        await supabase
          .from('alert_configurations')
          .delete()
          .eq('root_company_id', company.id);

        // 11. Delete knowledge base
        await supabase
          .from('knowledge_base')
          .delete()
          .eq('root_company_id', company.id);

        // 12. Delete company identity
        await supabase
          .from('company_identity')
          .delete()
          .eq('root_company_id', company.id);

        // 13. Delete profiles
        await supabase
          .from('profiles')
          .delete()
          .eq('root_company_id', company.id);

        // 14. Delete organizational structure (children first, then company)
        await supabase
          .from('organizational_structure')
          .delete()
          .eq('root_company_id', company.id)
          .neq('id', company.id);

        // 15. Mark company as deleted (keep for audit)
        await supabase
          .from('organizational_structure')
          .update({
            subscription_status: 'deleted',
            name: `[DELETED] ${company.name}`,
          })
          .eq('id', company.id);

        deleted++;
        console.log(`Successfully deleted data for company ${company.id}`);

        // Send confirmation email
        if (adminEmail) {
          const { subject, html } = getDeletionConfirmationEmail({
            userName: adminName,
            companyName: company.name,
          });

          try {
            await resend.emails.send({
              from: "CompSmart <noreply@compsmart.ia.br>",
              to: [adminEmail],
              subject,
              html,
            });
            emailsSent++;
            console.log(`Deletion confirmation email sent to ${adminEmail}`);
          } catch (emailError: any) {
            console.error(`Failed to send deletion email to ${adminEmail}:`, emailError);
          }
        }

        results.push({
          companyId: company.id,
          companyName: company.name,
          status: 'deleted',
          emailSent: !!adminEmail
        });

      } catch (deleteError: any) {
        console.error(`Error deleting company ${company.id}:`, deleteError);
        results.push({
          companyId: company.id,
          companyName: company.name,
          status: 'error',
          error: deleteError.message
        });
      }
    }

    console.log(`Data deletion job complete. Deleted: ${deleted}, Emails sent: ${emailsSent}`);

    return new Response(JSON.stringify({
      success: true,
      deleted,
      emailsSent,
      results
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in delete-expired-data:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
