-- Restringir auth_attempt_logs apenas para admins
DROP POLICY IF EXISTS "Admin and HR can view auth logs" ON public.auth_attempt_logs;
DROP POLICY IF EXISTS "Admins can view auth logs" ON public.auth_attempt_logs;
DROP POLICY IF EXISTS "HR can view auth logs" ON public.auth_attempt_logs;
DROP POLICY IF EXISTS "Admin/HR view auth logs" ON public.auth_attempt_logs;
DROP POLICY IF EXISTS "Admin and HR view auth logs" ON public.auth_attempt_logs;

CREATE POLICY "Only admins can view auth logs"
ON public.auth_attempt_logs
FOR SELECT
TO authenticated
USING (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role])
);