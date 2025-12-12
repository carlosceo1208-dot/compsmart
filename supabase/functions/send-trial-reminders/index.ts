import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

const getTrialReminderTemplate = (daysLeft: number, data: Record<string, any>): { subject: string; html: string } => {
  const urgencyColor = daysLeft <= 1 ? '#dc2626' : daysLeft <= 3 ? '#f59e0b' : '#6366f1';
  const urgencyText = daysLeft <= 1 ? 'URGENTE' : daysLeft <= 3 ? 'IMPORTANTE' : '';
  
  const baseStyles = `
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; }
      .container { max-width: 600px; margin: 0 auto; background: white; }
      .header { background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyColor}dd 100%); padding: 40px 30px; text-align: center; }
      .header h1 { color: white; margin: 0; font-size: 28px; }
      .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0; }
      .content { padding: 40px 30px; }
      .content h2 { color: #18181b; margin-top: 0; }
      .content p { color: #52525b; line-height: 1.6; }
      .countdown { background: ${urgencyColor}15; border: 2px solid ${urgencyColor}30; border-radius: 12px; padding: 30px; margin: 20px 0; text-align: center; }
      .countdown .number { font-size: 64px; font-weight: bold; color: ${urgencyColor}; line-height: 1; }
      .countdown .label { font-size: 18px; color: #52525b; margin-top: 5px; }
      .features-list { background: #f4f4f5; border-radius: 8px; padding: 20px; margin: 20px 0; }
      .features-list h3 { margin-top: 0; color: #18181b; }
      .features-list li { color: #52525b; padding: 8px 0; }
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
      <p>Em conformidade com a LGPD | <a href="https://compsmart.com.br/privacy">Política de Privacidade</a></p>
    </div>
  `;

  const featuresLost = `
    <div class="features-list">
      <h3>⚠️ Funcionalidades que você perderá:</h3>
      <ul>
        <li>🤖 Assistentes de IA (Jurídico, Salarial, R&B)</li>
        <li>📊 Análise salarial avançada</li>
        <li>🎯 Programas de incentivos</li>
        <li>📈 Comparação salarial com mercado</li>
        <li>🔔 Alertas automáticos</li>
        <li>📚 Base de conhecimento</li>
      </ul>
    </div>
  `;

  if (daysLeft === 0) {
    return {
      subject: `🚨 Seu trial CompSmart termina HOJE!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Seu Trial Termina Hoje!</h1>
              <p>Não perca acesso às funcionalidades premium</p>
            </div>
            <div class="content">
              <h2>Olá, ${data.userName}!</h2>
              <p><strong>Seu período de teste do CompSmart termina hoje.</strong> Após meia-noite, você perderá acesso às funcionalidades premium.</p>
              
              ${featuresLost}
              
              <div class="discount-box">
                <p style="margin: 0; font-size: 18px;">🎁 Oferta Exclusiva de Último Dia!</p>
                <p style="margin: 5px 0; font-size: 14px;">Use o cupom abaixo e ganhe <strong>20% OFF</strong> no primeiro pagamento:</p>
                <div class="code">TRIAL20</div>
              </div>
              
              <center>
                <a href="https://compsmart.com.br/pricing" class="button">Assinar Agora com 20% OFF</a>
              </center>
              
              <p style="font-size: 14px; color: #71717a;">
                Dúvidas sobre qual plano escolher? Fale conosco: comercial@compsmart.com.br
              </p>
            </div>
            ${footer}
          </div>
        </body>
        </html>
      `
    };
  }

  return {
    subject: `${urgencyText ? `[${urgencyText}] ` : ''}⏳ Seu trial CompSmart termina em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>${baseStyles}</head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Seu Trial Está Acabando!</h1>
            <p>Aproveite ao máximo antes que termine</p>
          </div>
          <div class="content">
            <h2>Olá, ${data.userName}!</h2>
            <p>Queremos lembrar que seu período de teste do CompSmart está chegando ao fim.</p>
            
            <div class="countdown">
              <div class="number">${daysLeft}</div>
              <div class="label">dia${daysLeft > 1 ? 's' : ''} restante${daysLeft > 1 ? 's' : ''}</div>
            </div>
            
            <p>Após o fim do trial em <strong>${data.trialEndsAt}</strong>, você perderá acesso às funcionalidades premium.</p>
            
            ${featuresLost}
            
            ${daysLeft <= 3 ? `
              <div class="discount-box">
                <p style="margin: 0; font-size: 18px;">🎁 Oferta Especial!</p>
                <p style="margin: 5px 0; font-size: 14px;">Assine agora e ganhe <strong>15% OFF</strong> no primeiro pagamento:</p>
                <div class="code">TRIAL15</div>
              </div>
            ` : ''}
            
            <center>
              <a href="https://compsmart.com.br/pricing" class="button">Ver Planos e Preços</a>
            </center>
            
            <p style="font-size: 14px; color: #71717a;">
              Precisa de mais tempo para avaliar? Entre em contato: comercial@compsmart.com.br
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
    console.log('Starting trial reminder check...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find companies in trial that need reminders
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reminderDays = [7, 3, 1, 0]; // Days before trial ends to send reminders

    const { data: trialCompanies, error } = await supabase
      .from('organizational_structure')
      .select(`
        id,
        name,
        trial_ends_at,
        billing_email
      `)
      .eq('subscription_status', 'trial')
      .not('trial_ends_at', 'is', null);

    if (error) {
      console.error('Error fetching trial companies:', error);
      throw error;
    }

    console.log(`Found ${trialCompanies?.length || 0} companies in trial`);

    let emailsSent = 0;
    const results: any[] = [];

    for (const company of trialCompanies || []) {
      const trialEnd = new Date(company.trial_ends_at);
      trialEnd.setHours(0, 0, 0, 0);
      
      const diffTime = trialEnd.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Check if we should send a reminder for this company
      if (!reminderDays.includes(daysLeft)) {
        continue;
      }

      // Get admin user for this company
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('root_company_id', company.id)
        .limit(1)
        .single();

      if (!adminProfile?.email) {
        console.log(`No admin email for company ${company.id}`);
        continue;
      }

      const recipientEmail = company.billing_email || adminProfile.email;
      
      const emailData = {
        userName: adminProfile.full_name || 'Cliente',
        companyName: company.name,
        trialEndsAt: formatDate(company.trial_ends_at),
      };

      const { subject, html } = getTrialReminderTemplate(daysLeft, emailData);

      try {
        const emailResponse = await resend.emails.send({
          from: "CompSmart <noreply@compsmart.com.br>",
          to: [recipientEmail],
          subject,
          html,
        });

        console.log(`Trial reminder sent to ${recipientEmail} (${daysLeft} days left)`);
        emailsSent++;
        results.push({
          companyId: company.id,
          email: recipientEmail,
          daysLeft,
          status: 'sent'
        });
      } catch (emailError: any) {
        console.error(`Failed to send email to ${recipientEmail}:`, emailError);
        results.push({
          companyId: company.id,
          email: recipientEmail,
          daysLeft,
          status: 'failed',
          error: emailError.message
        });
      }
    }

    console.log(`Trial reminder job complete. Emails sent: ${emailsSent}`);

    return new Response(JSON.stringify({ 
      success: true, 
      emailsSent,
      results 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in trial reminders:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
