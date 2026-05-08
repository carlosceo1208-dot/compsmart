-- 1. Audit logs: add tenant scoping column
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS root_company_id uuid;

-- Backfill from profiles where possible
UPDATE public.audit_logs al
SET root_company_id = p.root_company_id
FROM public.profiles p
WHERE al.root_company_id IS NULL AND al.user_id = p.id;

CREATE INDEX IF NOT EXISTS idx_audit_logs_root_company_id ON public.audit_logs(root_company_id);

-- Trigger to auto-populate root_company_id on insert when missing
CREATE OR REPLACE FUNCTION public.audit_logs_set_root_company_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.root_company_id IS NULL AND NEW.user_id IS NOT NULL THEN
    SELECT root_company_id INTO NEW.root_company_id
    FROM public.profiles WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_logs_set_root_company_id ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_set_root_company_id
BEFORE INSERT ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.audit_logs_set_root_company_id();

-- Replace company-admin SELECT policy with strict tenant scope on root_company_id
DROP POLICY IF EXISTS "Admins view own company audit logs" ON public.audit_logs;
CREATE POLICY "Admins view own company audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND root_company_id IS NOT NULL
  AND root_company_id = get_user_company_id()
);

-- 2. Realtime topic policy: prevent partial-match bypass via embedded UUIDs
DROP POLICY IF EXISTS "Company-scoped realtime subscriptions" ON realtime.messages;
CREATE POLICY "Company-scoped realtime subscriptions"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  topic ~ ('^[^:]+:' || (get_user_company_id())::text || '(:|$)')
);

-- 3. security_scan_snapshots: pass auth.uid() explicitly
DROP POLICY IF EXISTS "Super admins can read security scan snapshots" ON public.security_scan_snapshots;
DROP POLICY IF EXISTS "Super admins can insert security scan snapshots" ON public.security_scan_snapshots;
DROP POLICY IF EXISTS "Super admins can delete security scan snapshots" ON public.security_scan_snapshots;

CREATE POLICY "Super admins can read security scan snapshots"
ON public.security_scan_snapshots
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert security scan snapshots"
ON public.security_scan_snapshots
FOR INSERT
TO authenticated
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete security scan snapshots"
ON public.security_scan_snapshots
FOR DELETE
TO authenticated
USING (is_super_admin(auth.uid()));