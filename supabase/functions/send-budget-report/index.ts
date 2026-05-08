import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendReportRequest {
  recipients: string[];
  fiscalYear: number;
  statusFilter: string;
  unitFilter?: string;
  reportData: {
    totalPending: number;
    totalApproved: number;
    totalBudget: number;
    submissions: Array<{
      unitName: string;
      status: string;
      submittedBy: string;
      submittedAt: string;
      reviewedBy: string;
      totalAnnual: number;
    }>;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;

    // ============= SECURITY: JWT auth =============
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.replace('Bearer ', '');
    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const callerId = claims.claims.sub as string;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // SECURITY: Caller must be admin or hr_manager
    const { data: rolesRows } = await supabase
      .from('user_roles').select('role').eq('user_id', callerId);
    const userRoles = (rolesRows ?? []).map((r) => r.role);
    if (!userRoles.includes('admin') && !userRoles.includes('hr_manager')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { recipients, fiscalYear, statusFilter, unitFilter, reportData }: SendReportRequest = await req.json();

    // SECURITY: Validate recipients belong to caller's company
    const { data: callerProfile } = await supabase
      .from('profiles').select('root_company_id').eq('id', callerId).single();
    if (!callerProfile?.root_company_id) {
      return new Response(JSON.stringify({ error: 'No company on caller' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: validRecipientProfiles } = await supabase
      .from('profiles').select('email')
      .in('email', recipients ?? [])
      .eq('root_company_id', callerProfile.root_company_id);
    const allowedEmails = new Set((validRecipientProfiles ?? []).map((p) => p.email));
    const safeRecipients = (recipients ?? []).filter((e) => allowedEmails.has(e));
    if (safeRecipients.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid recipients in your company' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('Sending budget report to:', safeRecipients);

    // Buscar nome da unidade se filtrado
    let unitName = 'Todas as Unidades';
    if (unitFilter && unitFilter !== 'all') {
      const { data: unit } = await supabase
        .from('organizational_structure')
        .select('description')
        .eq('id', unitFilter)
        .single();
      if (unit) unitName = unit.description;
    }

    // Formatar status
    const statusLabels: Record<string, string> = {
      all: 'Todos os Status',
      submitted: '⏳ Pendentes',
      approved: '✅ Aprovados',
      rejected: '❌ Rejeitados',
    };
    const statusLabel = statusLabels[statusFilter] || statusFilter;

    // Criar tabela HTML das submissões
    // SECURITY: escape all client-supplied strings before HTML interpolation
    const esc = (s: string) => String(s ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    const submissionsTableRows = reportData.submissions.map(sub => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${esc(sub.unitName)}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${esc(sub.status)}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${esc(sub.submittedBy)}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${esc(sub.submittedAt)}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${esc(sub.reviewedBy)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sub.totalAnnual)}</td>
      </tr>
    `).join('');

    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background-color: #2980b9; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .summary { background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .summary-item { margin: 10px 0; }
            .table-container { overflow-x: auto; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background-color: #2980b9; color: white; padding: 10px; text-align: left; }
            td { padding: 8px; border: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .footer { background-color: #f4f4f4; padding: 15px; text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Relatório de Aprovações de Orçamento</h1>
          </div>
          
          <div class="content">
            <h2>Filtros Aplicados</h2>
            <div class="summary">
              <div class="summary-item"><strong>Ano Fiscal:</strong> ${fiscalYear}</div>
              <div class="summary-item"><strong>Status:</strong> ${esc(statusLabel)}</div>
              <div class="summary-item"><strong>Unidade:</strong> ${esc(unitName)}</div>
            </div>

            <h2>Resumo Consolidado</h2>
            <div class="summary">
              <div class="summary-item">
                <strong>⏳ Pendentes:</strong> ${reportData.totalPending}
              </div>
              <div class="summary-item">
                <strong>✅ Aprovados:</strong> ${reportData.totalApproved}
              </div>
              <div class="summary-item">
                <strong>💰 Total Aprovado:</strong> ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(reportData.totalBudget)}
              </div>
            </div>

            <h2>Submissões Detalhadas</h2>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Unidade</th>
                    <th>Status</th>
                    <th>Submetido Por</th>
                    <th>Data Submissão</th>
                    <th>Revisado Por</th>
                    <th>Total Anual</th>
                  </tr>
                </thead>
                <tbody>
                  ${submissionsTableRows}
                </tbody>
              </table>
            </div>
          </div>

          <div class="footer">
            <p>Este é um email automático gerado pelo sistema CompSmart.</p>
            <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
          </div>
        </body>
      </html>
    `;

    // Enviar emails para todos os destinatários
    const emailPromises = safeRecipients.map(async (recipient) => {
      return resend.emails.send({
        from: 'CompSmart <noreply@compsmart.ia.br>',
        to: [recipient],
        subject: `Relatório de Aprovações de Orçamento - ${fiscalYear} - ${statusLabel}`,
        html: htmlBody,
      });
    });

    const results = await Promise.allSettled(emailPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Email sending complete: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true,
        sent: successful,
        failed: failed,
        message: `${successful} emails enviados com sucesso${failed > 0 ? `, ${failed} falharam` : ''}`
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-budget-report function:", error);
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
