
-- cycle_decision_snapshots: privileged-only read
DROP POLICY IF EXISTS "Authenticated view snapshots in their company" ON public.cycle_decision_snapshots;
CREATE POLICY "Privileged roles view snapshots in their company"
ON public.cycle_decision_snapshots
FOR SELECT TO authenticated
USING (
  root_company_id = get_user_company_id()
  AND has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'super_admin'::app_role])
);

-- decision_scenarios: privileged-only read, retarget to authenticated
DROP POLICY IF EXISTS "Authenticated view scenarios in their company" ON public.decision_scenarios;
CREATE POLICY "Privileged roles view scenarios in their company"
ON public.decision_scenarios
FOR SELECT TO authenticated
USING (
  root_company_id = get_user_company_id()
  AND has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'super_admin'::app_role])
);

-- performance_alerts: restrict to admin/hr_manager/super_admin
DROP POLICY IF EXISTS "Users can view alerts from their company" ON public.performance_alerts;
CREATE POLICY "Privileged roles view alerts from their company"
ON public.performance_alerts
FOR SELECT TO authenticated
USING (
  (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'super_admin'::app_role]))
  OR is_super_admin(auth.uid())
);

-- engagement_metrics: restrict to admin/hr_manager/manager/super_admin
DROP POLICY IF EXISTS "Users can view metrics from their company" ON public.engagement_metrics;
CREATE POLICY "Privileged roles view engagement metrics"
ON public.engagement_metrics
FOR SELECT TO authenticated
USING (
  (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'manager'::app_role,'super_admin'::app_role]))
  OR is_super_admin(auth.uid())
);

-- merit_approval_requests: lock {public} policies to {authenticated}
DROP POLICY IF EXISTS "HR and admin can review merit requests" ON public.merit_approval_requests;
CREATE POLICY "HR and admin can review merit requests"
ON public.merit_approval_requests
FOR UPDATE TO authenticated
USING (
  (root_company_id IN (SELECT profiles.root_company_id FROM profiles WHERE profiles.id = auth.uid()))
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'hr_manager'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR (requested_by = auth.uid() AND status = 'pending'::text)
  )
);

DROP POLICY IF EXISTS "HR and managers can create merit requests" ON public.merit_approval_requests;
CREATE POLICY "HR and managers can create merit requests"
ON public.merit_approval_requests
FOR INSERT TO authenticated
WITH CHECK (
  (root_company_id = get_user_company_id())
  AND (
    has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'manager'::app_role,'super_admin'::app_role])
  )
);
