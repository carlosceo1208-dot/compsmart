-- 1. pay_equity_regression_results: tenant scoping on SELECT
DROP POLICY IF EXISTS "HR and Admin can view regression results" ON public.pay_equity_regression_results;
DROP POLICY IF EXISTS "Admin/HR view regression results" ON public.pay_equity_regression_results;
DROP POLICY IF EXISTS "Admin and HR view regression results" ON public.pay_equity_regression_results;

CREATE POLICY "Admin/HR view regression results (tenant-scoped)"
ON public.pay_equity_regression_results
FOR SELECT
TO authenticated
USING (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
  AND root_company_id = get_user_company_id()
);

-- 2. unit_merit_budgets: replace ALL policy with tenant-scoped variants
DROP POLICY IF EXISTS "Admin/HR can manage merit budgets" ON public.unit_merit_budgets;
DROP POLICY IF EXISTS "Admin and HR manage merit budgets" ON public.unit_merit_budgets;

CREATE POLICY "Admin/HR insert merit budgets (tenant-scoped)"
ON public.unit_merit_budgets
FOR INSERT
TO authenticated
WITH CHECK (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
  AND root_company_id = get_user_company_id()
);

CREATE POLICY "Admin/HR update merit budgets (tenant-scoped)"
ON public.unit_merit_budgets
FOR UPDATE
TO authenticated
USING (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
  AND root_company_id = get_user_company_id()
)
WITH CHECK (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
  AND root_company_id = get_user_company_id()
);

CREATE POLICY "Admin/HR delete merit budgets (tenant-scoped)"
ON public.unit_merit_budgets
FOR DELETE
TO authenticated
USING (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
  AND root_company_id = get_user_company_id()
);

-- 3. competencies: restrict to authenticated only
DROP POLICY IF EXISTS "Users can view all competencies" ON public.competencies;

CREATE POLICY "Authenticated users can view competencies"
ON public.competencies
FOR SELECT
TO authenticated
USING (true);