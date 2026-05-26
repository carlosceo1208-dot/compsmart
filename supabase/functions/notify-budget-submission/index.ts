import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  submissionId: string;
  unitName: string;
  submittedBy: string;
  totalAmount: number;
  fiscalYear: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
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
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const callerId = claims.claims.sub as string;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Resolve caller's company to scope notifications
    const { data: callerProfile } = await supabase
      .from('profiles').select('root_company_id').eq('id', callerId).single();
    const callerCompanyId = callerProfile?.root_company_id;
    if (!callerCompanyId) {
      return new Response(JSON.stringify({ error: 'No company on caller' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { submissionId, unitName, submittedBy, totalAmount, fiscalYear }: NotificationRequest = await req.json();

    // SECURITY: escape client-supplied strings before HTML interpolation
    const esc = (s: string) => String(s ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const safeUnit = esc(unitName);
    const safeSubmittedBy = esc(submittedBy);

    console.log('📧 Notificação orçamento:', { submissionId, unitName, fiscalYear, callerCompanyId });

    // SECURITY: Only fetch admin/HR users from the SAME company as the caller
    const { data: companyProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('root_company_id', callerCompanyId)
      .not('email', 'is', null);

    if (profilesError) throw profilesError;

    const companyUserIds = (companyProfiles ?? []).map((p) => p.id);
    if (companyUserIds.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum aprovador encontrado' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: adminHRUsers, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('user_id', companyUserIds)
      .in('role', ['admin', 'hr_manager']);

    if (rolesError) throw rolesError;

    const approverIds = new Set((adminHRUsers ?? []).map((r) => r.user_id));
    const profiles = (companyProfiles ?? []).filter((p) => approverIds.has(p.id));

    console.log(`📨 Enviando notificações para ${profiles?.length || 0} aprovadores`);

    // Enviar email para cada aprovador
    const emailPromises = profiles?.map(async (profile) => {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'CompSmart <noreply@compsmart.ia.br>',
            to: [profile.email!],
            subject: `📊 Novo Orçamento Submetido - ${unitName}`.replace(/[\r\n]+/g, ' '),
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                  .info-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px; }
                  .info-item { margin: 10px 0; }
                  .info-label { font-weight: bold; color: #555; }
                  .info-value { color: #333; }
                  .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                  .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>📊 Nova Submissão de Orçamento</h1>
                  </div>
                  <div class="content">
                    <p>Olá, <strong>${profile.full_name}</strong>!</p>
                    
                    <p>Um novo orçamento foi submetido para sua aprovação no CompSmart.</p>
                    
                    <div class="info-box">
                      <div class="info-item">
                        <span class="info-label">🏢 Unidade:</span>
                        <span class="info-value">${safeUnit}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">👤 Submetido por:</span>
                        <span class="info-value">${safeSubmittedBy}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">📅 Ano Fiscal:</span>
                        <span class="info-value">${fiscalYear}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">💰 Valor Total Anual:</span>
                        <span class="info-value">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)}</span>
                      </div>
                    </div>
                    
                    <p style="text-align: center;">
                      <a href="${supabaseUrl.replace('.supabase.co', '')}/budget-approvals" class="button">
                        📋 Revisar Orçamento Agora
                      </a>
                    </p>
                    
                    <p style="color: #666; font-size: 14px; margin-top: 20px;">
                      <strong>⏰ Ação Necessária:</strong> Acesse o sistema para revisar os detalhes do orçamento e aprová-lo ou rejeitá-lo.
                    </p>
                    
                    <div class="footer">
                      <p>Este é um email automático do CompSmart. Por favor, não responda.</p>
                      <p>&copy; ${new Date().getFullYear()} CompSmart - Gestão Inteligente de Remuneração</p>
                    </div>
                  </div>
                </div>
              </body>
              </html>
            `,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(`Resend API error: ${JSON.stringify(result)}`);
        }

        console.log(`✅ Email enviado para ${profile.email}:`, result);
        return result;
      } catch (error) {
        console.error(`❌ Erro ao enviar email para ${profile.email}:`, error);
        return null;
      }
    }) || [];

    const results = await Promise.allSettled(emailPromises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    
    console.log(`✅ Notificações enviadas: ${successCount}/${results.length}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `${successCount} notificações enviadas com sucesso`,
        submissionId 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('❌ Erro no edge function:', error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

serve(handler);