DROP POLICY IF EXISTS "Privileged roles and actor view merit history" ON public.merit_approval_history;
CREATE POLICY "Privileged roles and actor view merit history"
ON public.merit_approval_history
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM merit_approval_requests r
  WHERE r.id = merit_approval_history.request_id
    AND r.root_company_id = get_user_company_id()
    AND (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
         OR merit_approval_history.actor_id = auth.uid())
));