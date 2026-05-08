
DROP POLICY IF EXISTS "Admin lock snapshots" ON public.cycle_decision_snapshots;
CREATE POLICY "Admin lock snapshots" ON public.cycle_decision_snapshots
FOR INSERT TO authenticated
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]) AND root_company_id = get_user_company_id());

DROP POLICY IF EXISTS "Admin/HR insert talent recommendations" ON public.talent_intelligence_recommendations;
CREATE POLICY "Admin/HR insert talent recommendations" ON public.talent_intelligence_recommendations
FOR INSERT TO authenticated
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','hr_manager','super_admin']::app_role[]) AND root_company_id = get_user_company_id());

DROP POLICY IF EXISTS "Admin/HR update talent recommendations" ON public.talent_intelligence_recommendations;
CREATE POLICY "Admin/HR update talent recommendations" ON public.talent_intelligence_recommendations
FOR UPDATE TO authenticated
USING (has_any_role(auth.uid(), ARRAY['admin','hr_manager','super_admin']::app_role[]) AND root_company_id = get_user_company_id())
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','hr_manager','super_admin']::app_role[]) AND root_company_id = get_user_company_id());

DROP POLICY IF EXISTS "HR and Admin can create regression results" ON public.pay_equity_regression_results;
CREATE POLICY "HR and Admin can create regression results" ON public.pay_equity_regression_results
FOR INSERT TO authenticated
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','hr_manager','super_admin']::app_role[]) AND root_company_id = get_user_company_id());

DROP POLICY IF EXISTS "Insert projections policy" ON public.budget_employee_projections;
CREATE POLICY "Insert projections policy" ON public.budget_employee_projections
FOR INSERT TO authenticated
WITH CHECK (
  has_any_role(auth.uid(), ARRAY['admin','hr_manager','super_admin','manager']::app_role[])
  AND (
    (employee_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = budget_employee_projections.employee_id AND p.root_company_id = get_user_company_id()))
    OR
    (employee_id IS NULL AND projected_unit_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.organizational_structure o WHERE o.id = budget_employee_projections.projected_unit_id AND o.root_company_id = get_user_company_id()))
  )
);

DROP POLICY IF EXISTS "Update projections policy" ON public.budget_employee_projections;
CREATE POLICY "Update projections policy" ON public.budget_employee_projections
FOR UPDATE TO authenticated
USING (
  has_any_role(auth.uid(), ARRAY['admin','hr_manager','super_admin','manager']::app_role[])
  AND (
    (employee_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = budget_employee_projections.employee_id AND p.root_company_id = get_user_company_id()))
    OR
    (projected_unit_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.organizational_structure o WHERE o.id = budget_employee_projections.projected_unit_id AND o.root_company_id = get_user_company_id()))
  )
)
WITH CHECK (
  has_any_role(auth.uid(), ARRAY['admin','hr_manager','super_admin','manager']::app_role[])
  AND (
    (employee_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = budget_employee_projections.employee_id AND p.root_company_id = get_user_company_id()))
    OR
    (projected_unit_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.organizational_structure o WHERE o.id = budget_employee_projections.projected_unit_id AND o.root_company_id = get_user_company_id()))
  )
);

DROP POLICY IF EXISTS "Authenticated users can insert ledger entries in their company" ON public.merit_budget_ledger;
CREATE POLICY "Admin/HR can insert ledger entries in their company" ON public.merit_budget_ledger
FOR INSERT TO authenticated
WITH CHECK (
  has_any_role(auth.uid(), ARRAY['admin','hr_manager','super_admin']::app_role[])
  AND EXISTS (SELECT 1 FROM public.unit_merit_budgets mb WHERE mb.id = merit_budget_ledger.budget_id AND mb.root_company_id = get_user_company_id())
);

DROP POLICY IF EXISTS "Insert submissions policy" ON public.budget_submissions;
CREATE POLICY "Insert submissions policy" ON public.budget_submissions
FOR INSERT TO authenticated
WITH CHECK (
  has_any_role(auth.uid(), ARRAY['admin','hr_manager','super_admin','manager']::app_role[])
  AND unit_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.organizational_structure o WHERE o.id = budget_submissions.unit_id AND o.root_company_id = get_user_company_id())
);

DROP POLICY IF EXISTS "Authenticated insert assignments in their company" ON public.approval_assignments;
CREATE POLICY "Admin/HR insert assignments in their company" ON public.approval_assignments
FOR INSERT TO authenticated
WITH CHECK (
  has_any_role(auth.uid(), ARRAY['admin','hr_manager','super_admin']::app_role[])
  AND root_company_id = get_user_company_id()
);
