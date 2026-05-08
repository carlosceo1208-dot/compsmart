
-- ============ BUDGET SUBMISSIONS: Tenant scoping ============
DROP POLICY IF EXISTS "View submissions policy" ON public.budget_submissions;
DROP POLICY IF EXISTS "Update submissions policy" ON public.budget_submissions;
DROP POLICY IF EXISTS "Delete submissions policy" ON public.budget_submissions;

CREATE POLICY "View submissions policy"
ON public.budget_submissions
FOR SELECT
TO authenticated
USING (
  unit_id IN (
    SELECT id FROM public.organizational_structure
    WHERE root_company_id = public.get_user_company_id()
  )
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'hr_manager'::app_role)
    OR submitted_by = auth.uid()
    OR reviewed_by = auth.uid()
  )
);

CREATE POLICY "Update submissions policy"
ON public.budget_submissions
FOR UPDATE
TO authenticated
USING (
  unit_id IN (
    SELECT id FROM public.organizational_structure
    WHERE root_company_id = public.get_user_company_id()
  )
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'hr_manager'::app_role)
    OR submitted_by = auth.uid()
  )
)
WITH CHECK (
  unit_id IN (
    SELECT id FROM public.organizational_structure
    WHERE root_company_id = public.get_user_company_id()
  )
);

CREATE POLICY "Delete submissions policy"
ON public.budget_submissions
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND unit_id IN (
    SELECT id FROM public.organizational_structure
    WHERE root_company_id = public.get_user_company_id()
  )
);

-- ============ TALENT INTELLIGENCE RECOMMENDATIONS ============
DROP POLICY IF EXISTS "Admin/HR view all talent recommendations in company" ON public.talent_intelligence_recommendations;

CREATE POLICY "Admin/HR view all talent recommendations in company"
ON public.talent_intelligence_recommendations
FOR SELECT
TO authenticated
USING (
  root_company_id = public.get_user_company_id()
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'hr_manager'::app_role)
    OR employee_id = auth.uid()
  )
);

-- ============ SUCCESSION DECISIONS ============
DROP POLICY IF EXISTS "Users can update their own decisions" ON public.succession_decisions;

CREATE POLICY "Users can update their own decisions"
ON public.succession_decisions
FOR UPDATE
TO authenticated
USING (
  decision_by = auth.uid()
  AND root_company_id = public.get_user_company_id()
)
WITH CHECK (
  decision_by = auth.uid()
  AND root_company_id = public.get_user_company_id()
);

-- ============ AUDIT LOGS: Block direct API inserts ============
DROP POLICY IF EXISTS "Block direct inserts to audit_logs" ON public.audit_logs;

CREATE POLICY "Block direct inserts to audit_logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (false);
