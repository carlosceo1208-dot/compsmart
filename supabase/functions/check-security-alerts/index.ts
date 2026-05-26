import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuthAttempt {
  id: string;
  email: string;
  ip_address: string | null;
  success: boolean;
  created_at: string;
  company_id: string | null;
}

interface SecurityAlert {
  alert_type: string;
  severity: string;
  source_ip: string | null;
  target_email: string | null;
  company_id: string | null;
  details: Record<string, unknown>;
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
    
    console.log('Starting security alerts check...');
    
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    // Fetch recent auth attempts
    const { data: attempts, error: attemptsError } = await supabase
      .from('auth_attempt_logs')
      .select('*')
      .gte('created_at', fifteenMinutesAgo)
      .order('created_at', { ascending: false });
    
    if (attemptsError) {
      console.error('Error fetching auth attempts:', attemptsError);
      throw attemptsError;
    }
    
    console.log(`Found ${attempts?.length || 0} auth attempts in last 15 minutes`);
    
    const alerts: SecurityAlert[] = [];
    
    // Rule 1: Brute force by IP (>10 failures from same IP in 5 min)
    const recentAttempts = (attempts || []).filter(
      (a: AuthAttempt) => new Date(a.created_at) > new Date(fiveMinutesAgo)
    );
    
    const failedByIP: Record<string, AuthAttempt[]> = {};
    recentAttempts
      .filter((a: AuthAttempt) => !a.success && a.ip_address)
      .forEach((a: AuthAttempt) => {
        const ip = a.ip_address!;
        if (!failedByIP[ip]) failedByIP[ip] = [];
        failedByIP[ip].push(a);
      });
    
    for (const [ip, ipAttempts] of Object.entries(failedByIP)) {
      if (ipAttempts.length >= 10) {
        const emails = [...new Set(ipAttempts.map(a => a.email))];
        alerts.push({
          alert_type: 'brute_force_ip',
          severity: 'high',
          source_ip: ip,
          target_email: emails.join(', '),
          company_id: ipAttempts[0].company_id,
          details: {
            failed_attempts: ipAttempts.length,
            target_emails: emails,
            window_minutes: 5,
            first_attempt: ipAttempts[ipAttempts.length - 1].created_at,
            last_attempt: ipAttempts[0].created_at
          }
        });
        console.log(`ALERT: Brute force detected from IP ${ip} - ${ipAttempts.length} failures`);
      }
    }
    
    // Rule 2: Brute force by email (>5 failures for same email in 10 min)
    const tenMinAttempts = (attempts || []).filter(
      (a: AuthAttempt) => new Date(a.created_at) > new Date(tenMinutesAgo)
    );
    
    const failedByEmail: Record<string, AuthAttempt[]> = {};
    tenMinAttempts
      .filter((a: AuthAttempt) => !a.success)
      .forEach((a: AuthAttempt) => {
        if (!failedByEmail[a.email]) failedByEmail[a.email] = [];
        failedByEmail[a.email].push(a);
      });
    
    for (const [email, emailAttempts] of Object.entries(failedByEmail)) {
      if (emailAttempts.length >= 5) {
        const ips = [...new Set(emailAttempts.map(a => a.ip_address).filter(Boolean))];
        alerts.push({
          alert_type: 'brute_force_email',
          severity: 'medium',
          source_ip: ips.join(', '),
          target_email: email,
          company_id: emailAttempts[0].company_id,
          details: {
            failed_attempts: emailAttempts.length,
            source_ips: ips,
            window_minutes: 10,
            first_attempt: emailAttempts[emailAttempts.length - 1].created_at,
            last_attempt: emailAttempts[0].created_at
          }
        });
        console.log(`ALERT: Brute force detected for email ${email} - ${emailAttempts.length} failures`);
      }
    }
    
    // Rule 3: Mass attack (>50 global failures in 1 hour)
    const oneHourAttempts = (attempts || []).filter(
      (a: AuthAttempt) => new Date(a.created_at) > new Date(oneHourAgo)
    );
    
    const globalFailures = oneHourAttempts.filter((a: AuthAttempt) => !a.success);
    
    if (globalFailures.length >= 50) {
      const uniqueIPs = [...new Set(globalFailures.map(a => a.ip_address).filter(Boolean))];
      const uniqueEmails = [...new Set(globalFailures.map(a => a.email))];
      
      alerts.push({
        alert_type: 'mass_attack',
        severity: 'critical',
        source_ip: null,
        target_email: null,
        company_id: null,
        details: {
          total_failures: globalFailures.length,
          unique_ips: uniqueIPs.length,
          unique_emails: uniqueEmails.length,
          top_ips: uniqueIPs.slice(0, 10),
          top_emails: uniqueEmails.slice(0, 10),
          window_minutes: 60
        }
      });
      console.log(`ALERT: Mass attack detected - ${globalFailures.length} failures from ${uniqueIPs.length} IPs`);
    }
    
    // Insert alerts (check for duplicates first)
    let insertedCount = 0;
    
    for (const alert of alerts) {
      // Check if similar alert exists in last 30 minutes
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      
      const { data: existing } = await supabase
        .from('security_alerts')
        .select('id')
        .eq('alert_type', alert.alert_type)
        .eq('source_ip', alert.source_ip || '')
        .eq('target_email', alert.target_email || '')
        .gte('created_at', thirtyMinutesAgo)
        .limit(1);
      
      if (!existing || existing.length === 0) {
        const { error: insertError } = await supabase
          .from('security_alerts')
          .insert(alert);
        
        if (insertError) {
          console.error('Error inserting alert:', insertError);
        } else {
          insertedCount++;
          console.log(`Inserted new ${alert.alert_type} alert`);
        }
      } else {
        console.log(`Skipping duplicate ${alert.alert_type} alert`);
      }
    }
    
    const response = {
      success: true,
      checked_at: new Date().toISOString(),
      attempts_analyzed: attempts?.length || 0,
      alerts_detected: alerts.length,
      alerts_inserted: insertedCount
    };
    
    console.log('Security check completed:', response);
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in check-security-alerts:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
