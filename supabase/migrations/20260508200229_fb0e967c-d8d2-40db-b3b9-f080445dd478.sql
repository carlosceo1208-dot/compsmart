
-- 1) organizational_structure billing fields: restrict broad SELECT to admin/hr_manager/super_admin
DROP POLICY IF EXISTS "Users view own company structure" ON public.organizational_structure;

CREATE POLICY "Users view own company structure"
ON public.organizational_structure
FOR SELECT
TO authenticated
USING (
  root_company_id = public.get_user_company_id()
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'hr_manager'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'manager'::app_role)
    OR public.has_role(auth.uid(), 'employee'::app_role)
  )
);

-- Ensure billing columns are not directly selectable by authenticated role
REVOKE SELECT (cnpj, billing_email, payment_method, custom_monthly_price, custom_annual_price, subscription_started_at)
  ON public.organizational_structure FROM authenticated, anon, public;

-- 2) decision_scenario_items: restrict SELECT to privileged roles
DROP POLICY IF EXISTS "View items via scenario access" ON public.decision_scenario_items;

CREATE POLICY "View items via scenario access"
ON public.decision_scenario_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.decision_scenarios ds
    WHERE ds.id = decision_scenario_items.scenario_id
      AND ds.root_company_id = public.get_user_company_id()
      AND (
        public.has_role(auth.uid(), 'admin'::app_role)
        OR public.has_role(auth.uid(), 'hr_manager'::app_role)
        OR public.has_role(auth.uid(), 'super_admin'::app_role)
      )
  )
);

-- 3) glossary_terms: remove redundant fully-public policy
DROP POLICY IF EXISTS "glossary_terms_public_read" ON public.glossary_terms;
