
-- 1. Videos bucket: private + owner-only SELECT
UPDATE storage.buckets SET public = false WHERE id = 'videos';

DROP POLICY IF EXISTS "Users can view own videos" ON storage.objects;
CREATE POLICY "Users can view own videos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 2. pay_equity_alerts: drop non-tenant-scoped admin DELETE
DROP POLICY IF EXISTS "Admin delete pay equity alerts" ON public.pay_equity_alerts;

-- 3. executive_dashboard_indicators: restrict SELECT to admin/super_admin
DROP POLICY IF EXISTS "Authenticated users can view indicators" ON public.executive_dashboard_indicators;
DROP POLICY IF EXISTS "Authenticated read indicators" ON public.executive_dashboard_indicators;
DROP POLICY IF EXISTS "All authenticated can view indicators" ON public.executive_dashboard_indicators;
CREATE POLICY "Admins view executive indicators"
ON public.executive_dashboard_indicators FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role]));

-- 4. approval_notifications: scope to recipient's company
DROP POLICY IF EXISTS "Admin/HR manage notifications" ON public.approval_notifications;
CREATE POLICY "Admin/HR manage notifications tenant scoped"
ON public.approval_notifications FOR ALL
TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
  AND recipient_id IN (SELECT id FROM public.profiles WHERE root_company_id = public.get_user_company_id())
)
WITH CHECK (
  public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
  AND recipient_id IN (SELECT id FROM public.profiles WHERE root_company_id = public.get_user_company_id())
);

-- 5. decision_scenario_items: drop broad ALL policy
DROP POLICY IF EXISTS "Admin/HR manage items" ON public.decision_scenario_items;

-- 6. executive_ltip_simulations: tenant scope on SELECT/UPDATE/DELETE
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='executive_ltip_simulations'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.executive_ltip_simulations', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Admins view ltip sims tenant"
ON public.executive_ltip_simulations FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role])
  AND root_company_id = public.get_user_company_id());

CREATE POLICY "Admins insert ltip sims tenant"
ON public.executive_ltip_simulations FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role])
  AND root_company_id = public.get_user_company_id());

CREATE POLICY "Admins update ltip sims tenant"
ON public.executive_ltip_simulations FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role])
  AND root_company_id = public.get_user_company_id())
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role])
  AND root_company_id = public.get_user_company_id());

CREATE POLICY "Admins delete ltip sims tenant"
ON public.executive_ltip_simulations FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role])
  AND root_company_id = public.get_user_company_id());

-- 7. talent_intelligence_recommendations: tenant-scoped delete
DROP POLICY IF EXISTS "Admin delete talent recommendations" ON public.talent_intelligence_recommendations;
CREATE POLICY "Admin delete talent recommendations tenant"
ON public.talent_intelligence_recommendations FOR DELETE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
  AND root_company_id = public.get_user_company_id());

-- 8. approval_assignments: tenant scope
DROP POLICY IF EXISTS "Admin/HR manage assignments" ON public.approval_assignments;
CREATE POLICY "Admin/HR manage assignments tenant"
ON public.approval_assignments FOR ALL TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
  AND root_company_id = public.get_user_company_id())
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
  AND root_company_id = public.get_user_company_id());

-- 9. decision_scenarios: tenant scope
DROP POLICY IF EXISTS "Admin/HR manage scenarios" ON public.decision_scenarios;
CREATE POLICY "Admin/HR manage scenarios tenant"
ON public.decision_scenarios FOR ALL TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
  AND root_company_id = public.get_user_company_id())
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
  AND root_company_id = public.get_user_company_id());

-- 10. ltip_scenario_comparisons: tenant scope
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='ltip_scenario_comparisons'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.ltip_scenario_comparisons', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Admins manage ltip comparisons tenant"
ON public.ltip_scenario_comparisons FOR ALL TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
  AND root_company_id = public.get_user_company_id())
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
  AND root_company_id = public.get_user_company_id());
