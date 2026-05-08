
-- 1. alert_configurations
DROP POLICY IF EXISTS "Users can view their company alert configs" ON public.alert_configurations;
CREATE POLICY "Admin/HR view company alert configs"
ON public.alert_configurations FOR SELECT TO authenticated
USING (
  root_company_id = public.get_user_company_id()
  AND (public.has_role(auth.uid(),'admin'::app_role)
    OR public.has_role(auth.uid(),'hr_manager'::app_role)
    OR public.has_role(auth.uid(),'super_admin'::app_role))
);

-- 2. alert_history
DROP POLICY IF EXISTS "Users can view their company alerts" ON public.alert_history;
CREATE POLICY "Admin/HR view company alerts"
ON public.alert_history FOR SELECT TO authenticated
USING (
  root_company_id = public.get_user_company_id()
  AND (public.has_role(auth.uid(),'admin'::app_role)
    OR public.has_role(auth.uid(),'hr_manager'::app_role)
    OR public.has_role(auth.uid(),'super_admin'::app_role))
);

-- 3. approval_notifications
DROP POLICY IF EXISTS "Admin/HR insert notifications" ON public.approval_notifications;
CREATE POLICY "Admin/HR insert notifications"
ON public.approval_notifications FOR INSERT TO authenticated
WITH CHECK (
  (public.has_role(auth.uid(),'admin'::app_role)
    OR public.has_role(auth.uid(),'hr_manager'::app_role)
    OR public.has_role(auth.uid(),'super_admin'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = recipient_id
      AND p.root_company_id = public.get_user_company_id()
  )
);

-- 4. auth_attempt_logs
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename='auth_attempt_logs' AND cmd='SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.auth_attempt_logs', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Tenant admin/HR view scoped auth logs"
ON public.auth_attempt_logs FOR SELECT TO authenticated
USING (
  company_id IS NOT NULL
  AND company_id = public.get_user_company_id()
  AND (public.has_role(auth.uid(),'admin'::app_role)
    OR public.has_role(auth.uid(),'hr_manager'::app_role))
);

CREATE POLICY "Super admin view all auth logs"
ON public.auth_attempt_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'super_admin'::app_role));

-- 5. permissions
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename='permissions' AND cmd='SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.permissions', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Authenticated users can view permissions"
ON public.permissions FOR SELECT TO authenticated
USING (true);

-- 6. payment_methods
DROP POLICY IF EXISTS "Users view own company payment methods" ON public.payment_methods;
CREATE POLICY "Admins view company payment methods"
ON public.payment_methods FOR SELECT TO authenticated
USING (
  company_id = public.get_user_company_id()
  AND (public.has_role(auth.uid(),'admin'::app_role)
    OR public.has_role(auth.uid(),'super_admin'::app_role))
);

-- 7. company_subscriptions (uses company_id)
DROP POLICY IF EXISTS "Users view own company subscriptions" ON public.company_subscriptions;
CREATE POLICY "Admins view company subscriptions"
ON public.company_subscriptions FOR SELECT TO authenticated
USING (
  company_id = public.get_user_company_id()
  AND (public.has_role(auth.uid(),'admin'::app_role)
    OR public.has_role(auth.uid(),'super_admin'::app_role))
);

-- 8. collective_salary_adjustments
DROP POLICY IF EXISTS "Users can view own company adjustments" ON public.collective_salary_adjustments;
CREATE POLICY "Admin/HR view company adjustments"
ON public.collective_salary_adjustments FOR SELECT TO authenticated
USING (
  root_company_id = public.get_user_company_id()
  AND (public.has_role(auth.uid(),'admin'::app_role)
    OR public.has_role(auth.uid(),'hr_manager'::app_role)
    OR public.has_role(auth.uid(),'super_admin'::app_role))
);
