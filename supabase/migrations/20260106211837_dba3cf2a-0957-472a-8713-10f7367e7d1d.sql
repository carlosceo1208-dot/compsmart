-- Create security_alerts table for brute-force detection and security monitoring
CREATE TABLE public.security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL, -- 'brute_force_ip', 'brute_force_email', 'mass_attack', 'suspicious_pattern'
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  source_ip TEXT,
  target_email TEXT,
  company_id UUID REFERENCES public.organizational_structure(id),
  details JSONB,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'resolved')),
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only super_admin can view security alerts (using user_roles table)
CREATE POLICY "Super admins can view security alerts"
ON public.security_alerts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'super_admin'
  )
);

-- RLS Policy: Only super_admin can update security alerts
CREATE POLICY "Super admins can update security alerts"
ON public.security_alerts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'super_admin'
  )
);

-- RLS Policy: System can insert alerts (via service role)
CREATE POLICY "Service role can insert security alerts"
ON public.security_alerts
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_security_alerts_created_at ON public.security_alerts(created_at DESC);
CREATE INDEX idx_security_alerts_status ON public.security_alerts(status);
CREATE INDEX idx_security_alerts_severity ON public.security_alerts(severity);

-- Add company_id column to auth_attempt_logs if not exists (for company tracking)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'auth_attempt_logs' 
    AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.auth_attempt_logs ADD COLUMN company_id UUID REFERENCES public.organizational_structure(id);
  END IF;
END $$;