import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

const getExpirationEmailTemplate = (data: Record<string, any>): { subject: string; html: string } => {
  const baseStyles = `
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; }
      .container { max-width: 600px; margin: 0 auto; background: white; }
      .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 30px; text-align: center; }
      .header h1 { color: white; margin: 0; font-size: 28px; }
      .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0; }
      .content { padding: 40px 30px; }
      .content h2 { color: #18181b; margin-top: 0; }
      .content p { color: #52525b; line-height: 1.6; }
      .alert-box { background: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 30px; margin: 20px 0; text-align: center; }
      .alert-box .icon { font-size: 48px; margin-bottom: 10px; }
      .alert-box .title { font-size: 20px; font-weight: bold; color: #dc2626; margin-bottom: 10px; }
      .alert-box .countdown { font-size: 48px; font-weight: bold; color: #dc2626; }
      .alert-box .label { font-size: 16px; color: #52525b; }
      .info-box { background: #f4f4f5; border-radius: 8px; padding: 20px; margin: 20px 0; }
      .info-box h3 { margin-top: 0; color: #18181b; }
      .info-box p { color: #52525b; margin-bottom: 0; }
      .button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; font-size: 16px; }
      .discount-box { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
      .discount-box .code { font-size: 24px; font-weight: bold; letter-spacing: 2px; background: white; color: #059669; padding: 10px 20px; border-radius: 4px; display: inline-block; margin-top: 10px; }
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
    subject: `🚨 [BLOQUEIO] Seu período de teste do CompSmart expirou`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>${baseStyles}</head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Acesso Bloqueado</h1>
            <p>Seu período de teste expirou</p>
          </div>
          <div class="content">
            <h2>Olá, ${data.userName}!</h2>
            <p>O período de teste gratuito do CompSmart para a empresa <strong>${data.companyName}</strong> expirou.</p>
            
            <div class="alert-box">
              <div class="icon">⏰</div>
              <div class="title">ATENÇÃO: Seus dados serão excluídos em</div>
              <div class="countdown">7</div>
              <div class="label">dias</div>
            </div>
            
            <div class="info-box">
              <h3>📋 O que acontece agora?</h3>
              <p>
                • Seu acesso ao sistema está <strong>bloqueado</strong><br>
                • Todos os seus dados serão <strong>permanentemente excluídos</strong> em 7 dias<br>
                • Para manter seus dados e continuar usando o CompSmart, assine agora
              </p>
            </div>
            
            <p>Data de exclusão programada: <strong>${data.deletionDate}</strong></p>
            
            <div class="discount-box">
              <p style="margin: 0; font-size: 18px;">🎁 Oferta Especial de Recuperação!</p>
              <p style="margin: 5px 0; font-size: 14px;">Assine agora e ganhe <strong>25% OFF</strong> no primeiro pagamento:</p>
              <div class="code">RECUPERAR25</div>
            </div>
            
            <center>
              <a href="https://compsmart.ia.br/pricing" class="button">Assinar Agora e Manter Meus Dados</a>
            </center>
            
            <p style="font-size: 14px; color: #71717a;">
              Precisa de ajuda? Entre em contato: comercial@compsmart.ia.br
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
    console.log('Starting trial expiration processing...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();

    // Find companies with expired trials (trial_ends_at < now AND subscription_status = 'trial')
    const { data: expiredTrials, error } = await supabase
      .from('organizational_structure')
      .select(`
        id,
        name,
        trial_ends_at,
        billing_email,
        subscription_status
      `)
      .eq('subscription_status', 'trial')
      .lt('trial_ends_at', now.toISOString())
      .is('data_deletion_scheduled_at', null);

    if (error) {
      console.error('Error fetching expired trials:', error);
      throw error;
    }

    console.log(`Found ${expiredTrials?.length || 0} expired trials to process`);

    let processed = 0;
    let emailsSent = 0;
    const results: any[] = [];

    for (const company of expiredTrials || []) {
      // Calculate deletion date (7 days from now)
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 7);

      // Update company status to expired and set deletion date
      const { error: updateError } = await supabase
        .from('organizational_structure')
        .update({
          subscription_status: 'expired',
          data_deletion_scheduled_at: deletionDate.toISOString()
        })
        .eq('id', company.id);

      if (updateError) {
        console.error(`Error updating company ${company.id}:`, updateError);
        results.push({
          companyId: company.id,
          status: 'update_failed',
          error: updateError.message
        });
        continue;
      }

      processed++;
      console.log(`Company ${company.id} marked as expired, deletion scheduled for ${deletionDate.toISOString()}`);

      // Get admin user email for notification
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('root_company_id', company.id)
        .limit(1)
        .single();

      if (!adminProfile?.email) {
        console.log(`No admin email for company ${company.id}`);
        results.push({
          companyId: company.id,
          status: 'processed',
          emailSent: false,
          reason: 'no_admin_email'
        });
        continue;
      }

      const recipientEmail = company.billing_email || adminProfile.email;

      const emailData = {
        userName: adminProfile.full_name || 'Cliente',
        companyName: company.name,
        deletionDate: formatDate(deletionDate),
      };

      const { subject, html } = getExpirationEmailTemplate(emailData);

      try {
        await resend.emails.send({
          from: "CompSmart <noreply@compsmart.ia.br>",
          to: [recipientEmail],
          subject,
          html,
        });

        console.log(`Expiration email sent to ${recipientEmail}`);
        emailsSent++;
        results.push({
          companyId: company.id,
          email: recipientEmail,
          status: 'processed',
          emailSent: true
        });
      } catch (emailError: any) {
        console.error(`Failed to send email to ${recipientEmail}:`, emailError);
        results.push({
          companyId: company.id,
          email: recipientEmail,
          status: 'processed',
          emailSent: false,
          emailError: emailError.message
        });
      }
    }

    console.log(`Trial expiration job complete. Processed: ${processed}, Emails sent: ${emailsSent}`);

    return new Response(JSON.stringify({
      success: true,
      processed,
      emailsSent,
      results
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in process-trial-expiration:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
