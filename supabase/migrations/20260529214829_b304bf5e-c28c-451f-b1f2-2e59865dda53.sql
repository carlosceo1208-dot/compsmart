DROP POLICY IF EXISTS "Admins view own company billing" ON public.company_billing;
DROP POLICY IF EXISTS "Admins manage own company billing" ON public.company_billing;

CREATE POLICY "Admins view own company billing"
ON public.company_billing
FOR SELECT
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR (
    public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND EXISTS (
      SELECT 1
      FROM public.organizational_structure os
      WHERE os.id = company_billing.company_id
        AND (
          os.root_company_id = public.get_user_company_id()
          OR os.id = public.get_user_company_id()
        )
    )
  )
);

CREATE POLICY "Admins manage own company billing"
ON public.company_billing
FOR ALL
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR (
    public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND EXISTS (
      SELECT 1
      FROM public.organizational_structure os
      WHERE os.id = company_billing.company_id
        AND (
          os.root_company_id = public.get_user_company_id()
          OR os.id = public.get_user_company_id()
        )
    )
  )
)
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR (
    public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    AND EXISTS (
      SELECT 1
      FROM public.organizational_structure os
      WHERE os.id = company_billing.company_id
        AND (
          os.root_company_id = public.get_user_company_id()
          OR os.id = public.get_user_company_id()
        )
    )
  )
);