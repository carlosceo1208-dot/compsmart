
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
  SELECT os.id, os.cnpj, os.billing_email,
         os.custom_monthly_price, os.custom_annual_price, os.payment_method
  FROM public.organizational_structure os
  WHERE os.id = ANY(_company_ids)
    AND (
      _is_super
      OR os.root_company_id = _user_company
      OR os.id = _user_company
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_companies_billing_info(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_companies_billing_info(uuid[]) TO authenticated;
