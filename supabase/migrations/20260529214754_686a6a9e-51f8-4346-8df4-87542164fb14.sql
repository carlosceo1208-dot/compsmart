GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_billing TO authenticated;
GRANT ALL ON public.company_billing TO service_role;

CREATE OR REPLACE FUNCTION public.get_company_billing_info(_company_id uuid)
RETURNS TABLE (
  id uuid,
  cnpj text,
  billing_email text,
  custom_monthly_price numeric,
  custom_annual_price numeric,
  payment_method text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    is_super_admin(auth.uid())
    OR (
      has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
      AND EXISTS (
        SELECT 1 FROM public.organizational_structure os
        WHERE os.id = _company_id
          AND (os.root_company_id = get_user_company_id() OR os.id = get_user_company_id())
      )
    )
  ) THEN
    RAISE EXCEPTION 'Access denied: admin or hr_manager role required';
  END IF;

  RETURN QUERY
  SELECT cb.company_id, cb.cnpj, cb.billing_email,
         cb.custom_monthly_price, cb.custom_annual_price, cb.payment_method
  FROM public.company_billing cb
  WHERE cb.company_id = _company_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_company_billing_info(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_company_billing_info(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_companies_billing_info(_company_ids uuid[])
RETURNS TABLE (
  id uuid,
  cnpj text,
  billing_email text,
  custom_monthly_price numeric,
  custom_annual_price numeric,
  payment_method text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_company uuid := get_user_company_id();
  _is_super boolean := is_super_admin(auth.uid());
  _is_admin_hr boolean := has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]);
BEGIN
  IF NOT (_is_super OR _is_admin_hr) THEN
    RAISE EXCEPTION 'Access denied: admin or hr_manager role required';
  END IF;

  RETURN QUERY
  SELECT cb.company_id, cb.cnpj, cb.billing_email,
         cb.custom_monthly_price, cb.custom_annual_price, cb.payment_method
  FROM public.company_billing cb
  JOIN public.organizational_structure os ON os.id = cb.company_id
  WHERE cb.company_id = ANY(_company_ids)
    AND (
      _is_super
      OR os.root_company_id = _user_company
      OR os.id = _user_company
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_companies_billing_info(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_companies_billing_info(uuid[]) TO authenticated;