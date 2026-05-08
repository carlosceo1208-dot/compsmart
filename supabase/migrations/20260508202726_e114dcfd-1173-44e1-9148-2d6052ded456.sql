
-- 1) auth_attempt_logs: explicitly deny direct INSERT from authenticated/anon clients.
-- The log-auth-attempt edge function uses the service role and bypasses RLS.
DROP POLICY IF EXISTS "Block direct inserts on auth_attempt_logs" ON public.auth_attempt_logs;
CREATE POLICY "Block direct inserts on auth_attempt_logs"
ON public.auth_attempt_logs
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

-- 2) external_feedback_responses: restrict SELECT to admin/hr_manager/manager of the same company.
DROP POLICY IF EXISTS "Users view company external feedback responses" ON public.external_feedback_responses;
DROP POLICY IF EXISTS "Company users view external feedback responses" ON public.external_feedback_responses;
DROP POLICY IF EXISTS "Authenticated users view external feedback responses" ON public.external_feedback_responses;

CREATE POLICY "Admin HR Manager view company external feedback responses"
ON public.external_feedback_responses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.external_feedback_requests efr
    WHERE efr.id = external_feedback_responses.request_id
      AND efr.root_company_id = public.get_user_company_id()
  )
  AND public.has_any_role(auth.uid(), ARRAY['admin','hr_manager','manager']::app_role[])
);
