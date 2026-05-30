CREATE POLICY "HR managers can view company user feedback"
ON public.user_feedback
FOR SELECT
TO authenticated
USING (
  root_company_id IS NOT NULL
  AND has_role(auth.uid(), 'hr_manager'::app_role)
  AND root_company_id = get_user_company_id()
);