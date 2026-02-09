
-- Fix: Restrict external_feedback_requests SELECT to admin/hr/manager only
-- Currently any employee in the company can see external evaluator emails
DROP POLICY IF EXISTS "Users can view feedback requests from their company" ON public.external_feedback_requests;

CREATE POLICY "Admin HR Manager can view feedback requests"
ON public.external_feedback_requests
FOR SELECT
TO authenticated
USING (
  (root_company_id = get_user_company_id())
  AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'manager'::app_role])
);
