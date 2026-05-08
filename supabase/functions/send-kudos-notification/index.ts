import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface KudosNotificationRequest {
  kudosId: string;
  toEmployeeId: string;
  fromEmployeeName: string;
  toEmployeeEmail: string;
  toEmployeeName: string;
  category: string;
  message: string;
  isPublic: boolean;
}

const categoryLabels: Record<string, string> = {
  teamwork: "Trabalho em Equipe",
  innovation: "Inovação",
  leadership: "Liderança",
  customer_focus: "Foco no Cliente",
  excellence: "Excelência",
};

const categoryEmojis: Record<string, string> = {
  teamwork: "🤝",
  innovation: "💡",
  leadership: "🎯",
  customer_focus: "⭐",
  excellence: "🏆",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ============= SECURITY: JWT auth =============
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseService = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const callerId = claims.claims.sub as string;

    const {
      kudosId,
      toEmployeeId,
      fromEmployeeName,
      toEmployeeEmail,
      toEmployeeName,
      category,
      message,
      isPublic,
    }: KudosNotificationRequest = await req.json();

    if (!toEmployeeEmail || !fromEmployeeName || !message) {
      throw new Error("Missing required fields");
    }

    // SECURITY: Verify recipient belongs to the caller's company
    const adminClient = createClient(supabaseUrl, supabaseService);
    const { data: callerProfile } = await adminClient
      .from('profiles').select('root_company_id').eq('id', callerId).single();
    const { data: recipientProfile } = await adminClient
      .from('profiles').select('root_company_id, email').eq('email', toEmployeeEmail).maybeSingle();
    if (!callerProfile?.root_company_id ||
        !recipientProfile ||
        recipientProfile.root_company_id !== callerProfile.root_company_id) {
      return new Response(JSON.stringify({ error: 'Recipient not in your company' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const categoryLabel = categoryLabels[category] || category;
    const categoryEmoji = categoryEmojis[category] || "🎉";

    // SECURITY: escape all client-supplied strings before embedding in HTML
    const esc = (s: string) => String(s ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const safeFrom = esc(fromEmployeeName);
    const safeTo = esc(toEmployeeName);
    const safeMessage = esc(message);
    const safeCategoryLabel = esc(categoryLabel);
    const emailResponse = await resend.emails.send({
      from: "CompSmart <noreply@compsmart.com.br>",
      to: [toEmployeeEmail],
      subject: `${categoryEmoji} Você recebeu um reconhecimento de ${fromEmployeeName}!`.replace(/[\r\n]+/g, ' '),
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px;">
                        ${categoryEmoji} Reconhecimento
                      </h1>
                      <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                        Você foi reconhecido por um colega!
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="margin: 0 0 20px 0; color: #333; font-size: 16px;">
                        Olá, <strong>${safeTo}</strong>!
                      </p>
                      
                      <p style="margin: 0 0 30px 0; color: #666; font-size: 16px; line-height: 1.6;">
                        <strong>${safeFrom}</strong> enviou um reconhecimento para você na categoria <strong>${safeCategoryLabel}</strong>:
                      </p>
                      
                      <!-- Message Box -->
                      <div style="background: linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%); border-left: 4px solid #4f46e5; padding: 20px; border-radius: 8px; margin: 0 0 30px 0;">
                        <p style="margin: 0; color: #333; font-size: 16px; line-height: 1.6; font-style: italic;">
                          "${safeMessage}"
                        </p>
                      </div>
                      
                      <p style="margin: 0 0 30px 0; color: #666; font-size: 14px; line-height: 1.6;">
                        ${isPublic 
                          ? "🌐 Este reconhecimento é público e será visível para toda a equipe." 
                          : "🔒 Este reconhecimento é privado e visível apenas para você e quem enviou."}
                      </p>
                      
                      <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                        <strong>💡 Dica:</strong> Este reconhecimento será automaticamente incluído como evidência qualitativa na sua próxima avaliação de desempenho.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                        CompSmart - Gestão Inteligente de Remuneração e Desempenho
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Kudos notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-kudos-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
