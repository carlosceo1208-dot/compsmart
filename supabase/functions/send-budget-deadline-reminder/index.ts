import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderRequest {
  fiscalYear?: number;
  automatic?: boolean;
}

interface UnitWithoutSubmission {
  id: string;
  code: string;
  description: string;
  managerEmail: string | null;
  managerName: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { fiscalYear, automatic = false }: ReminderRequest = await req.json();

    // ============= SECURITY: Always require auth =============
    // Automatic invocations must use CRON_SECRET; manual must use a logged-in user JWT.
    const authHeader = req.headers.get("Authorization") ?? "";
    if (automatic) {
      const cronSecret = Deno.env.get("CRON_SECRET");
      if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return new Response(JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    } else {
      if (!authHeader.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const token = authHeader.replace("Bearer ", "");
      const userClient = createClient(supabaseUrl, supabaseAnon, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
      if (claimsErr || !claims?.claims?.sub) {
        return new Response(JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const callerId = claims.claims.sub as string;
      const { data: callerRoles } = await supabase
        .from("user_roles").select("role").eq("user_id", callerId);
      const userRoles = (callerRoles ?? []).map((r) => r.role);
      if (!userRoles.includes("admin") && !userRoles.includes("hr_manager")) {
        return new Response(JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    console.log(`[send-budget-deadline-reminder] Starting - fiscalYear: ${fiscalYear}, automatic: ${automatic}`);

    // Se automático, buscar todas as empresas com deadline configurado
    // Se manual, usar o fiscalYear passado
    let deadlineSettings: any[] = [];

    if (automatic) {
      // Buscar todos os deadlines ativos
      const { data, error } = await supabase
        .from('budget_deadline_settings')
        .select('*');

      if (error) {
        console.error('[send-budget-deadline-reminder] Error fetching deadlines:', error);
        throw error;
      }

      deadlineSettings = data || [];
    } else {
      // Buscar deadline específico do ano fiscal
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        throw new Error("Authorization header required for manual reminders");
      }

      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Buscar empresa do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('root_company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.root_company_id) {
        throw new Error("User company not found");
      }

      const { data, error } = await supabase
        .from('budget_deadline_settings')
        .select('*')
        .eq('fiscal_year', fiscalYear)
        .eq('root_company_id', profile.root_company_id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        deadlineSettings = [data];
      }
    }

    let totalSent = 0;
    const results: any[] = [];

    for (const settings of deadlineSettings) {
      const deadlineDate = new Date(settings.deadline_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysRemaining = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Se automático, verificar se deve enviar baseado nos dias configurados
      if (automatic) {
        const reminderDays = settings.reminder_days_before || [7, 3, 1];
        if (!reminderDays.includes(daysRemaining)) {
          console.log(`[send-budget-deadline-reminder] Skipping company ${settings.root_company_id} - days remaining (${daysRemaining}) not in reminder days`);
          continue;
        }

        // Verificar se já enviou lembrete hoje
        if (settings.last_reminder_sent_at) {
          const lastSent = new Date(settings.last_reminder_sent_at);
          if (lastSent.toDateString() === today.toDateString()) {
            console.log(`[send-budget-deadline-reminder] Skipping company ${settings.root_company_id} - already sent today`);
            continue;
          }
        }
      }

      // Buscar unidades sem submissão
      const { data: allUnits } = await supabase
        .from('organizational_structure')
        .select('id, code, description, type')
        .eq('root_company_id', settings.root_company_id)
        .in('type', ['area', 'department', 'sector', 'project']);

      const { data: submissions } = await supabase
        .from('budget_submissions')
        .select('unit_id')
        .eq('fiscal_year', settings.fiscal_year);

      const submittedUnitIds = new Set(submissions?.map(s => s.unit_id).filter(Boolean) || []);
      
      const unitsWithoutSubmission: UnitWithoutSubmission[] = [];

      for (const unit of allUnits || []) {
        if (!submittedUnitIds.has(unit.id)) {
          // Buscar gestor/funcionário da unidade
          const { data: managers } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('unit_id', unit.id)
            .not('email', 'is', null)
            .limit(1);

          const manager = managers?.[0];
          
          unitsWithoutSubmission.push({
            id: unit.id,
            code: unit.code || '',
            description: unit.description || '',
            managerEmail: manager?.email || null,
            managerName: manager?.full_name || null,
          });
        }
      }

      // Buscar nome da empresa
      const { data: company } = await supabase
        .from('organizational_structure')
        .select('name, fantasy_name')
        .eq('id', settings.root_company_id)
        .single();

      const companyName = company?.fantasy_name || company?.name || 'Empresa';

      // Enviar emails para gestores
      for (const unit of unitsWithoutSubmission) {
        if (!unit.managerEmail) {
          console.log(`[send-budget-deadline-reminder] No email for unit ${unit.code}`);
          continue;
        }

        const deadlineFormatted = deadlineDate.toLocaleDateString('pt-BR');
        const urgencyText = daysRemaining < 0 
          ? `⚠️ O prazo VENCEU há ${Math.abs(daysRemaining)} dia(s)!`
          : daysRemaining === 0 
            ? '🚨 O prazo é HOJE!'
            : daysRemaining <= 3 
              ? `⚠️ Faltam apenas ${daysRemaining} dia(s)!`
              : `📅 Faltam ${daysRemaining} dias`;

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
              .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
              .highlight { background: ${daysRemaining <= 3 ? '#fef2f2' : '#fef9c3'}; border-left: 4px solid ${daysRemaining <= 3 ? '#ef4444' : '#eab308'}; padding: 15px; margin: 20px 0; }
              .unit-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #e2e8f0; }
              .btn { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">📅 Lembrete de Orçamento</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Prazo de Submissão - Ano Fiscal ${settings.fiscal_year}</p>
              </div>
              <div class="content">
                <p>Olá${unit.managerName ? `, <strong>${unit.managerName}</strong>` : ''},</p>
                
                <p>Este é um lembrete sobre o prazo de submissão do orçamento para o ano fiscal de <strong>${settings.fiscal_year}</strong>.</p>
                
                <div class="highlight">
                  <strong>${urgencyText}</strong><br>
                  Prazo: <strong>${deadlineFormatted}</strong>
                </div>
                
                <div class="unit-box">
                  <strong>🏢 Sua Unidade:</strong><br>
                  ${unit.code} - ${unit.description}
                </div>
                
                <p>Por favor, acesse o sistema CompSmart para submeter o orçamento da sua unidade antes do prazo.</p>
                
                <a href="https://compsmart.lovable.app/budget-planning" class="btn">
                  Acessar Sistema
                </a>
                
                <div class="footer">
                  <p>Este é um email automático enviado pelo sistema CompSmart.</p>
                  <p>${companyName}</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        try {
          await resend.emails.send({
            from: "CompSmart <noreply@compsmart.ia.br>",
            to: [unit.managerEmail],
            subject: `🗓️ Lembrete: Prazo de Orçamento ${settings.fiscal_year} - ${urgencyText}`,
            html: emailHtml,
          });

          console.log(`[send-budget-deadline-reminder] Email sent to ${unit.managerEmail} for unit ${unit.code}`);
          totalSent++;
        } catch (emailError) {
          console.error(`[send-budget-deadline-reminder] Error sending email to ${unit.managerEmail}:`, emailError);
        }
      }

      // Atualizar last_reminder_sent_at
      await supabase
        .from('budget_deadline_settings')
        .update({ last_reminder_sent_at: new Date().toISOString() })
        .eq('id', settings.id);

      results.push({
        companyId: settings.root_company_id,
        unitsNotified: unitsWithoutSubmission.filter(u => u.managerEmail).length,
        daysRemaining,
      });
    }

    console.log(`[send-budget-deadline-reminder] Completed - total sent: ${totalSent}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: totalSent,
        results,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: any) {
    console.error("[send-budget-deadline-reminder] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
};

serve(handler);
