-- Revoke table-wide SELECT and re-grant only on non-sensitive columns.
-- Sensitive billing/subscription columns must go through get_company_billing_info().

REVOKE SELECT ON public.organizational_structure FROM anon, authenticated;

GRANT SELECT (
  id,
  name,
  type,
  code,
  description,
  parent_id,
  created_at,
  updated_at,
  fantasy_name,
  address,
  union_name,
  base_date,
  root_company_id,
  logo_url,
  subscription_plan_id,
  social_charges_percentage,
  industry_sector,
  latitude,
  longitude,
  default_language,
  data_deletion_scheduled_at,
  is_founder
) ON public.organizational_structure TO authenticated;