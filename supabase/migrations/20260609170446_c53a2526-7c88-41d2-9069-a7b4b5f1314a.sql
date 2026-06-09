
CREATE TABLE public.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  user_id UUID NOT NULL,
  event_name TEXT NOT NULL,
  event_category TEXT NOT NULL CHECK (event_category IN ('navigation', 'feature', 'action', 'system')),
  module_name TEXT,
  route_path TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  duration_ms INTEGER,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_usage_events_company_created ON public.usage_events(company_id, created_at DESC);
CREATE INDEX idx_usage_events_category ON public.usage_events(event_category);
CREATE INDEX idx_usage_events_module ON public.usage_events(module_name) WHERE module_name IS NOT NULL;
CREATE INDEX idx_usage_events_user ON public.usage_events(user_id, created_at DESC);

GRANT SELECT, INSERT ON public.usage_events TO authenticated;
GRANT ALL ON public.usage_events TO service_role;

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own usage events"
ON public.usage_events FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND company_id IN (SELECT root_company_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Super admin reads all usage events"
ON public.usage_events FOR SELECT TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Company admins read own company usage events"
ON public.usage_events FOR SELECT TO authenticated
USING (
  company_id IN (
    SELECT root_company_id FROM public.profiles
    WHERE id = auth.uid()
      AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'hr_manager'::app_role))
  )
);

CREATE TABLE public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  user_id UUID,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  component_stack TEXT,
  route_path TEXT,
  user_agent TEXT,
  severity TEXT NOT NULL DEFAULT 'error' CHECK (severity IN ('warning', 'error', 'critical')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_error_logs_created ON public.error_logs(created_at DESC);
CREATE INDEX idx_error_logs_company ON public.error_logs(company_id, created_at DESC) WHERE company_id IS NOT NULL;
CREATE INDEX idx_error_logs_severity ON public.error_logs(severity, created_at DESC);

GRANT SELECT, INSERT ON public.error_logs TO authenticated;
GRANT ALL ON public.error_logs TO service_role;

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own error logs"
ON public.error_logs FOR INSERT TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Super admin reads all error logs"
ON public.error_logs FOR SELECT TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Company admins read own company errors"
ON public.error_logs FOR SELECT TO authenticated
USING (
  company_id IS NOT NULL
  AND company_id IN (
    SELECT root_company_id FROM public.profiles
    WHERE id = auth.uid() AND public.has_role(auth.uid(), 'admin'::app_role)
  )
);
