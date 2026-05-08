
-- 1. incentive_eligibility: tenant-scoped manage
DROP POLICY IF EXISTS "Admins and HR can manage incentive eligibility" ON public.incentive_eligibility;
CREATE POLICY "Admins and HR can manage incentive eligibility"
ON public.incentive_eligibility
FOR ALL
TO authenticated
USING (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
  AND program_id IN (SELECT id FROM public.incentive_programs WHERE root_company_id = get_user_company_id())
)
WITH CHECK (
  has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
  AND program_id IN (SELECT id FROM public.incentive_programs WHERE root_company_id = get_user_company_id())
);

-- 2. executive_dashboard_indicators: global market data — readable by all authenticated, write by super_admin
DROP POLICY IF EXISTS "Admins view executive indicators" ON public.executive_dashboard_indicators;
DROP POLICY IF EXISTS "Admin can manage indicators" ON public.executive_dashboard_indicators;

CREATE POLICY "Authenticated users can view economic indicators"
ON public.executive_dashboard_indicators
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Super admins manage indicators"
ON public.executive_dashboard_indicators
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- 3. profiles: allow managers to read their direct reports' profiles within same company
CREATE POLICY "Managers can view direct reports profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  manager_id = auth.uid()
  AND root_company_id = get_user_company_id()
);

-- Remove the overlapping permissive UPDATE policy (the stricter "Admins update profiles in own company"
-- and "Users update own profile (no company change)" remain in place)
DROP POLICY IF EXISTS "Admins and HR managers can update profiles" ON public.profiles;

-- 4. performance_templates: restrict global template writes to super_admin
DROP POLICY IF EXISTS "Admins and HR manage templates" ON public.performance_templates;

CREATE POLICY "Admins and HR manage company templates"
ON public.performance_templates
FOR ALL
TO authenticated
USING (
  root_company_id = get_user_company_id()
  AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
)
WITH CHECK (
  root_company_id = get_user_company_id()
  AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
);

CREATE POLICY "Super admins manage global templates"
ON public.performance_templates
FOR ALL
TO authenticated
USING (
  is_global = true
  AND has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  is_global = true
  AND has_role(auth.uid(), 'super_admin'::app_role)
);

-- 5. rate_limit_log: allow authenticated users to insert their own entries
CREATE POLICY "Users can insert own rate limit logs"
ON public.rate_limit_log
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 6. audit_logs: remove cross-tenant leak via NULL user_id branch
DROP POLICY IF EXISTS "Admins view own company audit logs" ON public.audit_logs;
CREATE POLICY "Admins view own company audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND user_id IN (
    SELECT id FROM public.profiles WHERE root_company_id = get_user_company_id()
  )
);

-- Super admins can still see all audit logs (including NULL user_id system events)
CREATE POLICY "Super admins view all audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));
