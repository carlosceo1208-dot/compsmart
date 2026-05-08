-- =========================================================
-- 1) employee_benefits: scope admin/HR reads to own tenant
-- =========================================================
DROP POLICY IF EXISTS "Users can view own benefits" ON public.employee_benefits;

CREATE POLICY "Users can view own benefits"
ON public.employee_benefits
FOR SELECT
TO authenticated
USING (
  -- The employee themselves
  employee_id = auth.uid()
  OR
  -- Admin / HR within the same company only
  (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = employee_benefits.employee_id
        AND p.root_company_id = public.get_user_company_id()
    )
  )
);

-- =========================================================
-- 2) pay_equity_alerts: add tenant scope
-- =========================================================
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT polname FROM pg_policy
    WHERE polrelid = 'public.pay_equity_alerts'::regclass
      AND polcmd = 'r'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.pay_equity_alerts', pol.polname);
  END LOOP;
END $$;

CREATE POLICY "Admins and HR view pay equity alerts in their company"
ON public.pay_equity_alerts
FOR SELECT
TO authenticated
USING (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
  AND root_company_id = public.get_user_company_id()
);

-- =========================================================
-- 3) budget_employee_projections: add tenant scope to admin/HR branch
-- =========================================================
DROP POLICY IF EXISTS "View projections policy" ON public.budget_employee_projections;

CREATE POLICY "View projections policy"
ON public.budget_employee_projections
FOR SELECT
TO authenticated
USING (
  -- The employee themselves
  employee_id = auth.uid()
  OR
  -- Admin / HR within same company only
  (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = budget_employee_projections.employee_id
        AND p.root_company_id = public.get_user_company_id()
    )
  )
);

-- =========================================================
-- 4) merit_approval_history: restrict to authenticated only
-- =========================================================
DROP POLICY IF EXISTS "Company members can view merit history" ON public.merit_approval_history;

CREATE POLICY "Company members can view merit history"
ON public.merit_approval_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.merit_approval_requests r
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE r.id = merit_approval_history.request_id
      AND r.root_company_id = p.root_company_id
      AND r.root_company_id = public.get_user_company_id()
  )
);