-- 1. auth_attempt_logs: remove hr_manager from SELECT
DROP POLICY IF EXISTS "Admin and HR view auth logs" ON public.auth_attempt_logs;
DROP POLICY IF EXISTS "HR and admins view auth logs" ON public.auth_attempt_logs;
DROP POLICY IF EXISTS "Admin/HR view auth logs" ON public.auth_attempt_logs;
DROP POLICY IF EXISTS "Admin and HR can view auth logs" ON public.auth_attempt_logs;
DROP POLICY IF EXISTS "Admin and super admin view auth logs" ON public.auth_attempt_logs;
DROP POLICY IF EXISTS "Admins view auth logs (company)" ON public.auth_attempt_logs;

CREATE POLICY "Admin and Super Admin view auth logs"
ON public.auth_attempt_logs
FOR SELECT
TO authenticated
USING (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role])
);

-- 2. decision_scenario_items: add tenant scoping to write policies
DROP POLICY IF EXISTS "Admin/HR manage scenario items" ON public.decision_scenario_items;
DROP POLICY IF EXISTS "Admin and HR manage scenario items" ON public.decision_scenario_items;
DROP POLICY IF EXISTS "Admins manage scenario items" ON public.decision_scenario_items;

CREATE POLICY "Admin/HR insert scenario items (tenant-scoped)"
ON public.decision_scenario_items
FOR INSERT
TO authenticated
WITH CHECK (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
  AND EXISTS (
    SELECT 1 FROM public.decision_scenarios s
    WHERE s.id = decision_scenario_items.scenario_id
      AND s.root_company_id = get_user_company_id()
  )
);

CREATE POLICY "Admin/HR update scenario items (tenant-scoped)"
ON public.decision_scenario_items
FOR UPDATE
TO authenticated
USING (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
  AND EXISTS (
    SELECT 1 FROM public.decision_scenarios s
    WHERE s.id = decision_scenario_items.scenario_id
      AND s.root_company_id = get_user_company_id()
  )
)
WITH CHECK (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
  AND EXISTS (
    SELECT 1 FROM public.decision_scenarios s
    WHERE s.id = decision_scenario_items.scenario_id
      AND s.root_company_id = get_user_company_id()
  )
);

CREATE POLICY "Admin/HR delete scenario items (tenant-scoped)"
ON public.decision_scenario_items
FOR DELETE
TO authenticated
USING (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
  AND EXISTS (
    SELECT 1 FROM public.decision_scenarios s
    WHERE s.id = decision_scenario_items.scenario_id
      AND s.root_company_id = get_user_company_id()
  )
);