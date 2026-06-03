
-- 1) performance_merit_recommendations: remove employee self-read
DROP POLICY IF EXISTS "View merit recommendations" ON public.performance_merit_recommendations;
CREATE POLICY "View merit recommendations"
ON public.performance_merit_recommendations
FOR SELECT
USING (
  evaluation_id IN (
    SELECT performance_evaluations.id
    FROM performance_evaluations
    WHERE performance_evaluations.root_company_id = get_user_company_id()
      AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
  )
);

-- 2) talent_intelligence_recommendations: remove employee self-read
DROP POLICY IF EXISTS "Admin/HR view all talent recommendations in company" ON public.talent_intelligence_recommendations;
CREATE POLICY "Admin/HR view all talent recommendations in company"
ON public.talent_intelligence_recommendations
FOR SELECT
USING (
  root_company_id = get_user_company_id()
  AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
);

-- 3) merit_approval_requests: remove employee self-read; keep manager + HR/admin
DROP POLICY IF EXISTS "Restricted view of merit approvals" ON public.merit_approval_requests;
CREATE POLICY "Restricted view of merit approvals"
ON public.merit_approval_requests
FOR SELECT
USING (
  root_company_id = get_user_company_id()
  AND (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role, 'super_admin'::app_role])
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = merit_approval_requests.employee_id
        AND p.manager_id = auth.uid()
    )
  )
);

-- 4) company_billing: restrict CNPJ/billing email to admin + super_admin only
DROP POLICY IF EXISTS "Admins view own company billing" ON public.company_billing;
CREATE POLICY "Admins view own company billing"
ON public.company_billing
FOR SELECT
USING (
  is_super_admin(auth.uid())
  OR (
    has_role(auth.uid(), 'admin'::app_role)
    AND EXISTS (
      SELECT 1 FROM organizational_structure os
      WHERE os.id = company_billing.company_id
        AND (os.root_company_id = get_user_company_id() OR os.id = get_user_company_id())
    )
  )
);

DROP POLICY IF EXISTS "Admins manage own company billing" ON public.company_billing;
CREATE POLICY "Admins manage own company billing"
ON public.company_billing
FOR ALL
USING (
  is_super_admin(auth.uid())
  OR (
    has_role(auth.uid(), 'admin'::app_role)
    AND EXISTS (
      SELECT 1 FROM organizational_structure os
      WHERE os.id = company_billing.company_id
        AND (os.root_company_id = get_user_company_id() OR os.id = get_user_company_id())
    )
  )
)
WITH CHECK (
  is_super_admin(auth.uid())
  OR (
    has_role(auth.uid(), 'admin'::app_role)
    AND EXISTS (
      SELECT 1 FROM organizational_structure os
      WHERE os.id = company_billing.company_id
        AND (os.root_company_id = get_user_company_id() OR os.id = get_user_company_id())
    )
  )
);

-- 5) checkout_sessions: time-limit access to historical sessions (24h after creation for non-pending)
DROP POLICY IF EXISTS "Users view own active checkout sessions" ON public.checkout_sessions;
CREATE POLICY "Users view own active checkout sessions"
ON public.checkout_sessions
FOR SELECT
USING (
  user_id = auth.uid()
  AND (
    (status = 'pending'::text AND (expires_at IS NULL OR expires_at > now()))
    OR (status = ANY (ARRAY['paid'::text, 'failed'::text, 'expired'::text]) AND created_at > (now() - interval '24 hours'))
  )
);
