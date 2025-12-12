import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EmailType = 'payment_confirmed' | 'welcome' | 'payment_failed' | 'renewal_reminder';

interface EmailRequest {
  type: EmailType;
  userId?: string;
  companyId?: string;
  checkoutSessionId?: string;
  planName?: string;
  amount?: number;
  paymentMethod?: string;
  nextBillingDate?: string;
  invoiceNumber?: string;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

const getEmailTemplate = (type: EmailType, data: Record<string, any>): { subject: string; html: string } => {
  const baseStyles = `
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; }
      .container { max-width: 600px; margin: 0 auto; background: white; }
      .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center; }
      .header h1 { color: white; margin: 0; font-size: 28px; }
      .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0; }
      .content { padding: 40px 30px; }
      .content h2 { color: #18181b; margin-top: 0; }
      .content p { color: #52525b; line-height: 1.6; }
      .highlight-box { background: #f4f4f5; border-radius: 8px; padding: 20px; margin: 20px 0; }
      .highlight-box p { margin: 5px 0; }
      .highlight-box strong { color: #18181b; }
      .button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
      .footer { background: #18181b; padding: 30px; text-align: center; }
      .footer p { color: #a1a1aa; font-size: 12px; margin: 5px 0; }
      .footer a { color: #a1a1aa; }
      .success-icon { font-size: 48px; margin-bottom: 10px; }
      .warning-icon { font-size: 48px; margin-bottom: 10px; }
    </style>
  `;

  const footer = `
    <div class="footer">
      <p><strong>CompSmart</strong> - Gestão Inteligente em Remuneração</p>
      <p>Este email foi enviado automaticamente. Por favor, não responda.</p>
      <p>Em conformidade com a LGPD | <a href="https://compsmart.com.br/privacy">Política de Privacidade</a></p>
    </div>
  `;

  switch (type) {
    case 'payment_confirmed':
      return {
        subject: `✅ Pagamento Confirmado - CompSmart`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <div class="success-icon">✅</div>
                <h1>Pagamento Confirmado!</h1>
                <p>Seu pagamento foi processado com sucesso</p>
              </div>
              <div class="content">
                <h2>Olá, ${data.userName}!</h2>
                <p>Recebemos seu pagamento e sua assinatura está ativa.</p>
                
                <div class="highlight-box">
                  <p><strong>Plano:</strong> ${data.planName}</p>
                  <p><strong>Valor:</strong> ${data.amount}</p>
                  <p><strong>Forma de pagamento:</strong> ${data.paymentMethod}</p>
                  ${data.invoiceNumber ? `<p><strong>Nº da Fatura:</strong> ${data.invoiceNumber}</p>` : ''}
                  ${data.nextBillingDate ? `<p><strong>Próxima cobrança:</strong> ${data.nextBillingDate}</p>` : ''}
                </div>
                
                <p>Você já pode acessar todas as funcionalidades do seu plano.</p>
                
                <center>
                  <a href="https://compsmart.com.br/dashboard" class="button">Acessar Dashboard</a>
                </center>
                
                <p style="font-size: 14px; color: #71717a;">
                  Precisa de ajuda? Entre em contato pelo suporte@compsmart.com.br
                </p>
              </div>
              ${footer}
            </div>
          </body>
          </html>
        `
      };

    case 'welcome':
      return {
        subject: `🎉 Bem-vindo ao CompSmart!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <div class="success-icon">🎉</div>
                <h1>Bem-vindo ao CompSmart!</h1>
                <p>Sua jornada para uma gestão de remuneração inteligente começa agora</p>
              </div>
              <div class="content">
                <h2>Olá, ${data.userName}!</h2>
                <p>Parabéns por escolher o CompSmart para revolucionar a gestão de remuneração da sua empresa!</p>
                
                <div class="highlight-box">
                  <p><strong>🎯 Seu Plano:</strong> ${data.planName}</p>
                  <p><strong>📅 Início:</strong> ${formatDate(new Date().toISOString())}</p>
                </div>
                
                <h3 style="color: #18181b;">Próximos Passos:</h3>
                <ol style="color: #52525b; line-height: 2;">
                  <li>Configure sua estrutura organizacional</li>
                  <li>Importe seus funcionários</li>
                  <li>Defina sua tabela salarial</li>
                  <li>Explore os Agentes Smart de IA</li>
                </ol>
                
                <center>
                  <a href="https://compsmart.com.br/dashboard" class="button">Começar Agora</a>
                </center>
                
                <p style="font-size: 14px; color: #71717a;">
                  Dúvidas? Nossa equipe está pronta para ajudar: suporte@compsmart.com.br
                </p>
              </div>
              ${footer}
            </div>
          </body>
          </html>
        `
      };

    case 'payment_failed':
      return {
        subject: `⚠️ Falha no Pagamento - Ação Necessária`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);">
                <div class="warning-icon">⚠️</div>
                <h1>Falha no Pagamento</h1>
                <p>Não conseguimos processar seu pagamento</p>
              </div>
              <div class="content">
                <h2>Olá, ${data.userName}!</h2>
                <p>Infelizmente, não foi possível processar o pagamento da sua assinatura.</p>
                
                <div class="highlight-box" style="background: #fef2f2; border: 1px solid #fecaca;">
                  <p><strong>Plano:</strong> ${data.planName}</p>
                  <p><strong>Valor:</strong> ${data.amount}</p>
                  <p><strong>Motivo:</strong> ${data.failureReason || 'Pagamento recusado'}</p>
                </div>
                
                <p><strong>O que fazer agora?</strong></p>
                <ul style="color: #52525b; line-height: 2;">
                  <li>Verifique se há saldo suficiente</li>
                  <li>Confirme os dados do cartão</li>
                  <li>Tente outro método de pagamento</li>
                </ul>
                
                <center>
                  <a href="https://compsmart.com.br/settings/billing" class="button" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);">
                    Atualizar Pagamento
                  </a>
                </center>
                
                <p style="font-size: 14px; color: #71717a;">
                  Sua assinatura pode ser suspensa se o pagamento não for regularizado em 3 dias.
                </p>
              </div>
              ${footer}
            </div>
          </body>
          </html>
        `
      };

    case 'renewal_reminder':
      return {
        subject: `📅 Lembrete: Sua assinatura será renovada em breve`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <div class="success-icon">📅</div>
                <h1>Lembrete de Renovação</h1>
                <p>Sua assinatura será renovada automaticamente</p>
              </div>
              <div class="content">
                <h2>Olá, ${data.userName}!</h2>
                <p>Estamos passando para avisar que sua assinatura do CompSmart será renovada em breve.</p>
                
                <div class="highlight-box">
                  <p><strong>Plano:</strong> ${data.planName}</p>
                  <p><strong>Valor:</strong> ${data.amount}</p>
                  <p><strong>Data da Renovação:</strong> ${data.nextBillingDate}</p>
                </div>
                
                <p>Se você não deseja renovar, pode cancelar antes da data de renovação nas configurações da sua conta.</p>
                
                <center>
                  <a href="https://compsmart.com.br/settings/billing" class="button">Gerenciar Assinatura</a>
                </center>
                
                <p style="font-size: 14px; color: #71717a;">
                  Agradecemos por continuar conosco! 💜
                </p>
              </div>
              ${footer}
            </div>
          </body>
          </html>
        `
      };

    default:
      return { subject: '', html: '' };
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: EmailRequest = await req.json();
    console.log('Email request received:', requestData.type);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch user and company data
    let userData: Record<string, any> = {};
    
    if (requestData.userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', requestData.userId)
        .single();
      
      if (profile) {
        userData.userName = profile.full_name || 'Cliente';
        userData.userEmail = profile.email;
      }
    }

    if (requestData.companyId) {
      const { data: company } = await supabase
        .from('organizational_structure')
        .select('name, billing_email')
        .eq('id', requestData.companyId)
        .single();
      
      if (company) {
        userData.companyName = company.name;
        userData.billingEmail = company.billing_email;
      }
    }

    // Merge request data with fetched data
    const emailData = {
      ...userData,
      planName: requestData.planName || 'CompSmart',
      amount: requestData.amount ? formatCurrency(requestData.amount) : 'N/A',
      paymentMethod: requestData.paymentMethod === 'pix' ? 'PIX' :
                     requestData.paymentMethod === 'credit_card' ? 'Cartão de Crédito' :
                     requestData.paymentMethod === 'debit_card' ? 'Cartão de Débito' :
                     requestData.paymentMethod === 'boleto' ? 'Boleto' : 'N/A',
      nextBillingDate: requestData.nextBillingDate ? formatDate(requestData.nextBillingDate) : null,
      invoiceNumber: requestData.invoiceNumber,
    };

    const recipientEmail = userData.billingEmail || userData.userEmail;
    
    if (!recipientEmail) {
      console.error('No recipient email found');
      return new Response(JSON.stringify({ error: 'No recipient email' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subject, html } = getEmailTemplate(requestData.type, emailData);

    const emailResponse = await resend.emails.send({
      from: "CompSmart <noreply@compsmart.com.br>",
      to: [recipientEmail],
      subject,
      html,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
