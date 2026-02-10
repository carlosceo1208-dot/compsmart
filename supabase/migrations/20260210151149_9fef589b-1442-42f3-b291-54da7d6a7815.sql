-- Fix auth_attempt_logs cross-company exposure: restrict to same company
DROP POLICY IF EXISTS "Admins and HR can view auth logs" ON public.auth_attempt_logs;

CREATE POLICY "Admins and HR can view auth logs within company"
ON public.auth_attempt_logs
FOR SELECT
USING (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
  AND (
    company_id = get_user_company_id()
    OR company_id IS NULL
  )
);