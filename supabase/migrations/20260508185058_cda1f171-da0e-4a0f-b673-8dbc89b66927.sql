
-- merit_approval_history: restrict to privileged roles + actor/employee
DROP POLICY IF EXISTS "Company members can view merit history" ON public.merit_approval_history;
CREATE POLICY "Privileged roles and actor view merit history"
ON public.merit_approval_history
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.merit_approval_requests r
    WHERE r.id = merit_approval_history.request_id
      AND r.root_company_id = get_user_company_id()
      AND (
        has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'super_admin'::app_role])
        OR merit_approval_history.actor_id = auth.uid()
        OR r.employee_id = auth.uid()
      )
  )
);

-- merit_budget_ledger: restrict to admin/hr/manager/super_admin
DROP POLICY IF EXISTS "Authenticated can view ledger in their company" ON public.merit_budget_ledger;
CREATE POLICY "Privileged roles view ledger in their company"
ON public.merit_budget_ledger
FOR SELECT TO authenticated
USING (
  has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'manager'::app_role,'super_admin'::app_role])
  AND EXISTS (
    SELECT 1 FROM public.unit_merit_budgets b
    WHERE b.id = merit_budget_ledger.budget_id
      AND b.root_company_id = get_user_company_id()
  )
);

-- unit_merit_budgets: restrict to admin/hr/manager/super_admin
DROP POLICY IF EXISTS "Authenticated can view merit budgets in their company" ON public.unit_merit_budgets;
CREATE POLICY "Privileged roles view merit budgets in their company"
ON public.unit_merit_budgets
FOR SELECT TO authenticated
USING (
  has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'manager'::app_role,'super_admin'::app_role])
  AND root_company_id = get_user_company_id()
);

-- salary_tables: lock to authenticated
DROP POLICY IF EXISTS "Users view own company salary tables" ON public.salary_tables;
CREATE POLICY "Users view own company salary tables"
ON public.salary_tables
FOR SELECT TO authenticated
USING (root_company_id = get_user_company_id());

DROP POLICY IF EXISTS "Admins and HR manage own company salary tables" ON public.salary_tables;
CREATE POLICY "Admins and HR manage own company salary tables"
ON public.salary_tables
FOR ALL TO authenticated
USING (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role]))
WITH CHECK (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role]));

-- cycle_decision_snapshots: lock to authenticated
DROP POLICY IF EXISTS "Authenticated view snapshots in their company" ON public.cycle_decision_snapshots;
CREATE POLICY "Authenticated view snapshots in their company"
ON public.cycle_decision_snapshots
FOR SELECT TO authenticated
USING (root_company_id = (SELECT profiles.root_company_id FROM profiles WHERE profiles.id = auth.uid()));

-- collective_salary_adjustments: lock manage policy to authenticated
DROP POLICY IF EXISTS "Admins and HR can manage adjustments" ON public.collective_salary_adjustments;
CREATE POLICY "Admins and HR can manage adjustments"
ON public.collective_salary_adjustments
FOR ALL TO authenticated
USING (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role]))
WITH CHECK (root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role]));
