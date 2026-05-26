import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertConfig {
  id: string;
  root_company_id: string;
  threshold_value: number;
  enabled: boolean;
  severity: string;
  recipients: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[check-budget-alerts] Starting budget variance check...');

    // Buscar configurações de alerta de variação orçamentária ativas
    const { data: alertConfigs, error: configError } = await supabase
      .from('alert_configurations')
      .select('*')
      .eq('alert_type', 'budget_variance')
      .eq('enabled', true);

    if (configError) {
      console.error('[check-budget-alerts] Error fetching configs:', configError);
      throw configError;
    }

    if (!alertConfigs || alertConfigs.length === 0) {
      console.log('[check-budget-alerts] No active budget_variance alerts configured');
      return new Response(
        JSON.stringify({ success: true, message: 'No active alerts to check', alertsGenerated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentYear = new Date().getFullYear();
    const projectedYear = currentYear + 1;
    let alertsGenerated = 0;

    for (const config of alertConfigs as AlertConfig[]) {
      console.log(`[check-budget-alerts] Checking company ${config.root_company_id}...`);

      // SECURITY: derive tenant unit scope. budget_* tables don't carry root_company_id,
      // so we must restrict by unit_id belonging to this company's organizational tree.
      const { data: tenantUnits } = await supabase
        .from('organizational_structure')
        .select('id')
        .eq('root_company_id', config.root_company_id);

      const tenantUnitIds = (tenantUnits ?? []).map((u: { id: string }) => u.id);
      if (tenantUnitIds.length === 0) {
        console.log(`[check-budget-alerts] No units for company ${config.root_company_id}`);
        continue;
      }

      // Buscar projeções do ano atual (escopo por tenant via unit_id)
      const { data: currentProjections } = await supabase
        .from('budget_employee_projections')
        .select('projected_fixed_salary, projected_variable_salary, projected_benefits, projected_unit_id')
        .eq('fiscal_year', currentYear)
        .eq('is_active', true)
        .in('projected_unit_id', tenantUnitIds);

      // Submissões aprovadas do ano projetado (escopo por tenant)
      const { data: projectedSubmissions } = await supabase
        .from('budget_submissions')
        .select('id, unit_id, status')
        .eq('fiscal_year', projectedYear)
        .eq('status', 'approved')
        .in('unit_id', tenantUnitIds);

      if (!projectedSubmissions || projectedSubmissions.length === 0) {
        console.log(`[check-budget-alerts] No approved budget for ${projectedYear}`);
        continue;
      }

      const { data: projectedProjections } = await supabase
        .from('budget_employee_projections')
        .select('projected_fixed_salary, projected_variable_salary, projected_benefits, projected_unit_id')
        .eq('fiscal_year', projectedYear)
        .eq('is_active', true)
        .in('projected_unit_id', tenantUnitIds);

      // Calcular totais anuais
      const calculateAnnualTotal = (projections: any[] | null) => {
        if (!projections || projections.length === 0) return 0;
        const monthlyTotal = projections.reduce((sum, p) => 
          sum + Number(p.projected_fixed_salary || 0) + 
          Number(p.projected_variable_salary || 0) + 
          Number(p.projected_benefits || 0), 0
        );
        return monthlyTotal * 12;
      };

      const previousTotal = calculateAnnualTotal(currentProjections);
      const currentTotal = calculateAnnualTotal(projectedProjections);

      if (previousTotal === 0) {
        console.log(`[check-budget-alerts] No baseline data for ${currentYear}`);
        continue;
      }

      const variancePercent = ((currentTotal - previousTotal) / previousTotal) * 100;
      const exceedsThreshold = variancePercent > config.threshold_value;

      console.log(`[check-budget-alerts] Variance: ${variancePercent.toFixed(2)}%, Threshold: ${config.threshold_value}%`);

      if (exceedsThreshold) {
        // Verificar se já existe alerta ativo para este período
        const { data: existingAlert } = await supabase
          .from('alert_history')
          .select('id')
          .eq('root_company_id', config.root_company_id)
          .eq('alert_type', 'budget_variance')
          .eq('status', 'active')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Últimas 24h
          .single();

        if (existingAlert) {
          console.log(`[check-budget-alerts] Active alert already exists, skipping...`);
          continue;
        }

        // Criar novo alerta
        const { error: alertError } = await supabase
          .from('alert_history')
          .insert({
            root_company_id: config.root_company_id,
            alert_type: 'budget_variance',
            severity: config.severity || 'warning',
            title: `⚠️ Variação Orçamentária Acima do Limite`,
            description: `O orçamento de ${projectedYear} está ${variancePercent.toFixed(1)}% acima de ${currentYear}. Limite configurado: ${config.threshold_value}%.`,
            metric_value: variancePercent,
            threshold_value: config.threshold_value,
            context: {
              projectedYear,
              currentYear,
              previousTotal,
              currentTotal,
              variancePercent,
            },
            email_recipients: config.recipients,
            status: 'active',
          });

        if (alertError) {
          console.error('[check-budget-alerts] Error creating alert:', alertError);
        } else {
          alertsGenerated++;
          console.log(`[check-budget-alerts] Alert created for company ${config.root_company_id}`);
        }
      }
    }

    console.log(`[check-budget-alerts] Completed. Alerts generated: ${alertsGenerated}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Budget variance check completed',
        alertsGenerated,
        checkedConfigs: alertConfigs.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[check-budget-alerts] Error:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
