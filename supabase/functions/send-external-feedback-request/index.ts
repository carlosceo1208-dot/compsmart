import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "CompSmart <noreply@compsmart.ia.br>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return res.json();
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendFeedbackRequest {
  requestId: string;
}

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const getExternalTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    customer: "Cliente",
    supplier: "Fornecedor",
    partner: "Parceiro",
    other: "Parceiro de Negócios",
  };
  return labels[type] || "Parceiro";
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user token
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { requestId }: SendFeedbackRequest = await req.json();

    if (!requestId) {
      return new Response(
        JSON.stringify({ error: "requestId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch request details with related data
    const { data: feedbackRequest, error: fetchError } = await supabase
      .from("external_feedback_requests")
      .select(`
        *,
        employee:profiles!external_feedback_requests_employee_id_fkey(full_name, job_title),
        company:organizational_structure!external_feedback_requests_root_company_id_fkey(description, logo_url)
      `)
      .eq("id", requestId)
      .single();

    if (fetchError || !feedbackRequest) {
      console.error("Error fetching request:", fetchError);
      return new Response(
        JSON.stringify({ error: "Solicitação não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already sent or completed
    if (feedbackRequest.status === "completed") {
      return new Response(
        JSON.stringify({ error: "Esta solicitação já foi respondida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const employeeName = feedbackRequest.employee?.full_name || "Colaborador";
    const employeeTitle = feedbackRequest.employee?.job_title || "";
    const companyName = feedbackRequest.company?.description || "Empresa";
    const externalTypeLabel = getExternalTypeLabel(feedbackRequest.external_type);
    const deadlineFormatted = formatDate(feedbackRequest.deadline);

    // Build the feedback form URL
    const baseUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", "");
    const feedbackFormUrl = `https://compsmart.lovable.app/feedback/${feedbackRequest.token}`;

    const emailHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Solicitação de Feedback 360</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f9;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 40px; border-radius: 12px 12px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                Solicitação de Feedback
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">
                ${companyName} - Avaliação 360°
              </p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Prezado(a) <strong>${feedbackRequest.external_name}</strong>,
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                A <strong>${companyName}</strong> está realizando um ciclo de <strong>Avaliação 360°</strong>, 
                uma ferramenta de gestão de pessoas que busca coletar perspectivas de diferentes 
                stakeholders para desenvolver nossos colaboradores.
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Como você interage com <strong>${employeeName}</strong>${employeeTitle ? ` (${employeeTitle})` : ''} 
                em sua função de <strong>${externalTypeLabel}</strong>, gostaríamos de contar com sua 
                contribuição para esse processo.
              </p>
              
              <!-- Info Box -->
              <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #0369a1; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">
                  💡 O que é Avaliação 360°?
                </h3>
                <p style="color: #0c4a6e; margin: 0; font-size: 14px; line-height: 1.5;">
                  É um método onde coletamos feedback de múltiplas fontes (gestor, colegas, subordinados 
                  e parceiros externos como você) para obter uma visão completa do desempenho profissional.
                </p>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Suas respostas serão tratadas com <strong>confidencialidade</strong> e utilizadas 
                exclusivamente para fins de desenvolvimento profissional.
              </p>
              
              ${feedbackRequest.custom_message ? `
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.5;">
                  <strong>Mensagem do solicitante:</strong><br/>
                  ${feedbackRequest.custom_message}
                </p>
              </div>
              ` : ''}
              
              <!-- Deadline -->
              <div style="background-color: #fef2f2; border-radius: 8px; padding: 16px 20px; margin: 24px 0; text-align: center;">
                <p style="color: #991b1b; margin: 0; font-size: 14px;">
                  ⏰ <strong>Prazo para resposta:</strong> ${deadlineFormatted}
                </p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${feedbackFormUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); 
                          color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; 
                          font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);">
                  Responder Avaliação
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0;">
                ⏱️ Tempo estimado: 5-10 minutos
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0; text-align: center;">
                Agradecemos sua colaboração!<br/>
                <strong>Equipe de RH - ${companyName}</strong>
              </p>
              <p style="color: #9ca3af; font-size: 11px; margin: 16px 0 0 0; text-align: center;">
                Este e-mail foi enviado automaticamente pelo sistema CompSmart.<br/>
                Se você não reconhece esta solicitação, por favor ignore este e-mail.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send email via Resend
    const emailResponse = await sendEmail(
      feedbackRequest.external_email,
      `Solicitação de Feedback - ${employeeName} | ${companyName}`,
      emailHtml
    );

    console.log("Email sent successfully:", emailResponse);

    // Update request status to 'sent'
    const { error: updateError } = await supabase
      .from("external_feedback_requests")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) {
      console.error("Error updating request status:", updateError);
      // Email was sent, so we return success but log the error
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "E-mail enviado com sucesso",
        emailId: emailResponse.id 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-external-feedback-request:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
