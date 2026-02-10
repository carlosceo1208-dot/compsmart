
-- Fix external_feedback_requests: restrict managers to only see requests they created
-- Admin/HR still see all company requests
DROP POLICY IF EXISTS "Admin HR Manager can view feedback requests" ON public.external_feedback_requests;

-- Admin and HR can view all company feedback requests
CREATE POLICY "Admin HR view all feedback requests"
ON public.external_feedback_requests
FOR SELECT
TO authenticated
USING (
  root_company_id = get_user_company_id()
  AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
);

-- Managers can only view feedback requests they created
CREATE POLICY "Managers view own feedback requests"
ON public.external_feedback_requests
FOR SELECT
TO authenticated
USING (
  root_company_id = get_user_company_id()
  AND has_role(auth.uid(), 'manager'::app_role)
  AND requested_by = auth.uid()
);
