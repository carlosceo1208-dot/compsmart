import { supabase } from '@/integrations/supabase/client';

interface LogErrorInput {
  error: Error;
  componentStack?: string;
  severity?: 'warning' | 'error' | 'critical';
}

/**
 * Registra erros do frontend na tabela error_logs (telemetria interna).
 * Fire-and-forget — nunca lança exceção.
 */
export async function logFrontendError({ error, componentStack, severity = 'error' }: LogErrorInput) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    let companyId: string | null = null;
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('root_company_id')
        .eq('id', user.id)
        .maybeSingle();
      companyId = profile?.root_company_id ?? null;
    }

    await supabase.from('error_logs').insert({
      company_id: companyId,
      user_id: user?.id ?? null,
      error_message: (error.message ?? 'Unknown error').slice(0, 1000),
      error_stack: error.stack?.slice(0, 5000) ?? null,
      component_stack: componentStack?.slice(0, 5000) ?? null,
      route_path: window.location.pathname,
      user_agent: navigator.userAgent.slice(0, 255),
      severity,
    });
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[errorLogger] failed:', err);
  }
}
