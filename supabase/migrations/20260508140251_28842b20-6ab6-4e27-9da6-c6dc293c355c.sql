
DROP POLICY IF EXISTS "Company members can view merit approvals" ON public.merit_approval_requests;
CREATE POLICY "Restricted view of merit approvals"
ON public.merit_approval_requests FOR SELECT TO authenticated
USING (
  root_company_id = public.get_user_company_id()
  AND (
    public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
    OR employee_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = merit_approval_requests.employee_id AND p.manager_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Company members view talent rec history" ON public.talent_recommendation_history;
CREATE POLICY "Restricted view of talent rec history"
ON public.talent_recommendation_history FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.talent_intelligence_recommendations r
    WHERE r.id = talent_recommendation_history.recommendation_id
      AND r.root_company_id = public.get_user_company_id()
      AND (
        public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
        OR r.employee_id = auth.uid()
      )
  )
);

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT polname FROM pg_policy WHERE polrelid = 'public.succession_decisions'::regclass AND polcmd = 'a'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.succession_decisions', pol.polname);
  END LOOP;
END $$;

CREATE POLICY "Admin/HR insert succession decisions"
ON public.succession_decisions FOR INSERT TO authenticated
WITH CHECK (
  root_company_id = public.get_user_company_id()
  AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
);

DROP POLICY IF EXISTS "Insert projections policy" ON public.budget_employee_projections;
CREATE POLICY "Insert projections policy"
ON public.budget_employee_projections FOR INSERT TO authenticated
WITH CHECK (
  public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = budget_employee_projections.employee_id
      AND p.root_company_id = public.get_user_company_id()
  )
);
