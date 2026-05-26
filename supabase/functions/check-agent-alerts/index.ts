import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const esc = (s: unknown) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

interface AlertConfig {
  id: string;
  root_company_id: string;
  alert_type: string;
  threshold_value: number;
  threshold_unit: string;
  severity: string;
  recipients: string[];
  enabled: boolean;
  organizational_structure?: { name: string };
}

interface DetectionResult {
  detected: boolean;
  title: string;
  description: string;
  metric_value: number;
  context: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // SECURITY: Require CRON_SECRET for scheduled invocations
  const cronSecret = Deno.env.get('CRON_SECRET');
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Starting automatic alert check...');

    // 1. Buscar todas as configurações ativas
    const { data: configs, error: configError } = await supabase
      .from('alert_configurations')
      .select(`
        *,
        organizational_structure!inner(name)
      `)
      .eq('enabled', true);

    if (configError) throw configError;

    console.log(`Found ${configs?.length || 0} active alert configurations`);

    const alertsToSend: any[] = [];

    // 2. Para cada empresa, verificar cada tipo de alerta
    for (const config of configs || []) {
      const companyName = config.organizational_structure?.name || 'Empresa';
      
      let result: DetectionResult | null = null;

      // 3. Executar função de detecção correspondente
      switch (config.alert_type) {
        case 'spike_queries':
          result = await checkQuerySpike(supabase, config, companyName);
          break;
        case 'recurring_errors':
          result = await checkRecurringErrors(supabase, config, companyName);
          break;
        case 'inactive_users':
          result = await checkInactiveUsers(supabase, config, companyName);
          break;
        case 'token_overconsumption':
          result = await checkTokenOverconsumption(supabase, config, companyName);
          break;
        case 'after_hours_usage':
          result = await checkAfterHoursUsage(supabase, config, companyName);
          break;
        case 'user_concentration':
          result = await checkUserConcentration(supabase, config, companyName);
          break;
      }

      // 4. Se detectou anomalia, criar registro e enviar email
      if (result?.detected) {
        console.log(`⚠️ Alert detected: ${config.alert_type} for ${companyName}`);

        // Salvar no histórico
        const { data: alert } = await supabase
          .from('alert_history')
          .insert({
            root_company_id: config.root_company_id,
            alert_type: config.alert_type,
            severity: config.severity,
            title: result.title,
            description: result.description,
            metric_value: result.metric_value,
            threshold_value: config.threshold_value,
            context: result.context,
            email_recipients: config.recipients
          })
          .select()
          .single();

        if (alert) {
          alertsToSend.push({
            alert,
            config,
            companyName,
            result
          });
        }
      }
    }

    // 5. Enviar todos os emails
    console.log(`📧 Sending ${alertsToSend.length} alert emails...`);

    for (const { alert, config, companyName, result } of alertsToSend) {
      await sendAlertEmail(
        resend,
        config.recipients,
        companyName,
        config.severity,
        result.title,
        result.description,
        alert.id
      );

      // Marcar email como enviado
      await supabase
        .from('alert_history')
        .update({
          email_sent: true,
          email_sent_at: new Date().toISOString()
        })
        .eq('id', alert.id);
    }

    console.log(`✅ Alert check complete. ${alertsToSend.length} alerts sent.`);

    return new Response(
      JSON.stringify({
        success: true,
        alerts_detected: alertsToSend.length,
        message: `Verificação concluída. ${alertsToSend.length} alertas enviados.`
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in check-agent-alerts:", error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

// Funções auxiliares de detecção
async function checkQuerySpike(supabase: any, config: AlertConfig, companyName: string): Promise<DetectionResult | null> {
  const { data } = await supabase.rpc('detect_query_spikes', {
    p_company_id: config.root_company_id,
    p_threshold: config.threshold_value
  });

  if (data && data.detected) {
    return {
      detected: true,
      title: `🚀 Pico Anormal de Consultas - ${companyName}`,
      description: `Detectamos um aumento de ${Math.round(data.percentage_increase)}% nas consultas aos Agentes Smart hoje.\n\n` +
        `📊 Consultas hoje: ${data.current_count}\n` +
        `📈 Média últimos 7 dias: ${Math.round(data.avg_last_7_days)}\n` +
        `⚠️ Threshold: ${config.threshold_value}%`,
      metric_value: data.current_count,
      context: data
    };
  }
  return null;
}

async function checkRecurringErrors(supabase: any, config: AlertConfig, companyName: string): Promise<DetectionResult | null> {
  const { data } = await supabase.rpc('detect_recurring_errors', {
    p_company_id: config.root_company_id,
    p_threshold: config.threshold_value
  });

  if (data && data.detected) {
    return {
      detected: true,
      title: `⚠️ Erros Recorrentes Detectados - ${companyName}`,
      description: `Detectamos ${data.slow_queries} consultas com problemas de performance hoje.\n\n` +
        `🐌 Consultas lentas (>5s): ${data.slow_queries}\n` +
        `👥 Usuários afetados: ${data.affected_users?.join(', ')}\n` +
        `⚠️ Threshold: ${config.threshold_value} erros`,
      metric_value: data.slow_queries,
      context: data
    };
  }
  return null;
}

async function checkInactiveUsers(supabase: any, config: AlertConfig, companyName: string): Promise<DetectionResult | null> {
  const { data } = await supabase.rpc('detect_inactive_users', {
    p_company_id: config.root_company_id,
    p_days_threshold: config.threshold_value
  });

  if (data && data.detected) {
    const users = data.inactive_users || [];
    return {
      detected: true,
      title: `😴 Usuários Inativos - ${companyName}`,
      description: `Encontramos ${data.inactive_count} usuário(s) que não usam os Agentes Smart há mais de ${config.threshold_value} dias.\n\n` +
        `📋 Usuários inativos:\n${users.slice(0, 5).map((u: any) => `• ${u.user_name} - ${u.last_usage}`).join('\n')}\n\n` +
        `💡 Considere revisar permissões ou oferecer treinamento.`,
      metric_value: data.inactive_count,
      context: data
    };
  }
  return null;
}

async function checkTokenOverconsumption(supabase: any, config: AlertConfig, companyName: string): Promise<DetectionResult | null> {
  const monthlyLimit = 100000; // Pode ser configurável

  const { data } = await supabase.rpc('detect_token_overconsumption', {
    p_company_id: config.root_company_id,
    p_monthly_limit: monthlyLimit,
    p_threshold_percentage: config.threshold_value
  });

  if (data && data.detected) {
    return {
      detected: true,
      title: `💰 Consumo Alto de Tokens - ${companyName}`,
      description: `O consumo de tokens IA está em ${Math.round(data.percentage_used)}% do limite mensal.\n\n` +
        `🔢 Tokens usados: ${data.tokens_used.toLocaleString()}\n` +
        `📊 Limite mensal: ${data.tokens_limit.toLocaleString()}\n` +
        `📈 Projeção fim do mês: ${Math.round(data.projected_total).toLocaleString()}\n` +
        `⏰ Dias decorridos: ${data.days_elapsed}\n\n` +
        `⚠️ Threshold: ${config.threshold_value}%`,
      metric_value: data.percentage_used,
      context: data
    };
  }
  return null;
}

async function checkAfterHoursUsage(supabase: any, config: AlertConfig, companyName: string): Promise<DetectionResult | null> {
  const { data } = await supabase.rpc('detect_after_hours_usage', {
    p_company_id: config.root_company_id,
    p_threshold: config.threshold_value
  });

  if (data && data.detected) {
    return {
      detected: true,
      title: `🌙 Uso Fora do Horário - ${companyName}`,
      description: `Detectamos ${data.after_hours_count} consultas fora do horário comercial hoje.\n\n` +
        `🕐 Horários: 22h-6h ou fins de semana\n` +
        `⚠️ Threshold: ${config.threshold_value} consultas\n\n` +
        `💡 Verifique se o uso é legítimo ou se há acesso não autorizado.`,
      metric_value: data.after_hours_count,
      context: data
    };
  }
  return null;
}

async function checkUserConcentration(supabase: any, config: AlertConfig, companyName: string): Promise<DetectionResult | null> {
  const { data } = await supabase.rpc('detect_user_concentration', {
    p_company_id: config.root_company_id,
    p_threshold: config.threshold_value
  });

  if (data && data.detected) {
    return {
      detected: true,
      title: `👤 Concentração de Uso - ${companyName}`,
      description: `Um único usuário está responsável por ${Math.round(data.concentration_percentage)}% das consultas este mês.\n\n` +
        `👤 Usuário: ${data.top_user_name}\n` +
        `📊 Consultas: ${data.top_user_count} de ${data.total_count} total\n` +
        `⚠️ Threshold: ${config.threshold_value}%\n\n` +
        `💡 Considere treinar outros usuários para distribuir o uso.`,
      metric_value: data.concentration_percentage,
      context: data
    };
  }
  return null;
}

// Função de envio de email
async function sendAlertEmail(
  resend: any,
  recipients: string[],
  companyName: string,
  severity: string,
  title: string,
  description: string,
  alertId: string
) {
  const severityColors: Record<string, string> = {
    info: '#3498db',
    warning: '#f39c12',
    critical: '#e74c3c'
  };

  const severityLabels: Record<string, string> = {
    info: 'ℹ️ Informação',
    warning: '⚠️ Aviso',
    critical: '🚨 Crítico'
  };

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { 
            background-color: ${severityColors[severity]}; 
            color: white; 
            padding: 20px; 
            text-align: center; 
          }
          .content { padding: 20px; }
          .alert-box { 
            background-color: #f4f4f4; 
            padding: 15px; 
            border-left: 4px solid ${severityColors[severity]}; 
            margin: 20px 0; 
          }
          .footer { 
            background-color: #f4f4f4; 
            padding: 15px; 
            text-align: center; 
            margin-top: 20px; 
            font-size: 12px; 
            color: #666; 
          }
          .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: ${severityColors[severity]};
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${esc(severityLabels[severity])}</h1>
          <p>${esc(companyName)}</p>
        </div>
        
        <div class="content">
          <h2>${esc(title)}</h2>
          
          <div class="alert-box">
            <p style="white-space: pre-line;">${esc(description)}</p>
          </div>

          <p>
            <strong>📅 Detectado em:</strong> ${new Date().toLocaleString('pt-BR')}<br>
            <strong>🔖 ID do Alerta:</strong> ${alertId}
          </p>

          <a href="${Deno.env.get('SUPABASE_URL')}/alert-settings" class="button">
            Ver Detalhes no Dashboard
          </a>
        </div>

        <div class="footer">
          <p>Este é um alerta automático do sistema CompSmart.</p>
          <p>Para gerenciar suas configurações de alertas, acesse o painel de controle.</p>
        </div>
      </body>
    </html>
  `;

  for (const recipient of recipients) {
    try {
      await resend.emails.send({
        from: 'CompSmart Alertas <alerts@compsmart.ia.br>',
        to: [recipient],
        subject: `${severityLabels[severity]}: ${title}`,
        html: htmlBody,
      });
      console.log(`✅ Email sent to ${recipient}`);
    } catch (error) {
      console.error(`❌ Failed to send email to ${recipient}:`, error);
    }
  }
}

serve(handler);
