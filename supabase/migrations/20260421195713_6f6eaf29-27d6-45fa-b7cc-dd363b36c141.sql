-- Tenant scoping for pay_equity_alerts write policies
DROP POLICY IF EXISTS "Admin/HR insert pay equity alerts" ON public.pay_equity_alerts;
DROP POLICY IF EXISTS "Admin/HR update pay equity alerts" ON public.pay_equity_alerts;
DROP POLICY IF EXISTS "Admin/HR delete pay equity alerts" ON public.pay_equity_alerts;
DROP POLICY IF EXISTS "Admins can insert pay equity alerts" ON public.pay_equity_alerts;
DROP POLICY IF EXISTS "Admins can update pay equity alerts" ON public.pay_equity_alerts;
DROP POLICY IF EXISTS "Admins can delete pay equity alerts" ON public.pay_equity_alerts;
DROP POLICY IF EXISTS "HR can manage pay equity alerts" ON public.pay_equity_alerts;
DROP POLICY IF EXISTS "Admin and HR manage pay equity alerts" ON public.pay_equity_alerts;
DROP POLICY IF EXISTS "Users insert pay equity alerts" ON public.pay_equity_alerts;
DROP POLICY IF EXISTS "Users update pay equity alerts" ON public.pay_equity_alerts;
DROP POLICY IF EXISTS "Users delete pay equity alerts" ON public.pay_equity_alerts;

CREATE POLICY "Admin/HR insert pay equity alerts (tenant-scoped)"
ON public.pay_equity_alerts
FOR INSERT
TO authenticated
WITH CHECK (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
  AND root_company_id = get_user_company_id()
);

CREATE POLICY "Admin/HR update pay equity alerts (tenant-scoped)"
ON public.pay_equity_alerts
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

CREATE POLICY "Admin/HR delete pay equity alerts (tenant-scoped)"
ON public.pay_equity_alerts
FOR DELETE
TO authenticated
USING (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
  AND root_company_id = get_user_company_id()
);