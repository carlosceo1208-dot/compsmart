-- =====================================================
-- SECURITY FIX: Restrict profiles and compensation view access
-- =====================================================

-- 1. Drop and recreate profiles_compensation_directory view with security_invoker
-- This ensures the view respects RLS policies of underlying tables
DROP VIEW IF EXISTS public.profiles_compensation_directory;

CREATE VIEW public.profiles_compensation_directory
WITH (security_invoker = on)
AS
SELECT 
  p.id AS user_id,
  p.full_name,
  p.email,
  p.job_title_id,
  jt.title AS job_title,
  p.grade,
  p.unit_id,
  os.name AS unit_name,
  p.root_company_id,
  p.salary,
  p.variable_salary,
  p.benefits_value AS total_benefits_value,
  (COALESCE(p.short_term_incentive, 0) + COALESCE(p.long_term_incentive, 0)) AS total_incentives_value,
  p.hire_date,
  p.avatar_url,
  (p.status = 'active') AS is_active
FROM public.profiles p
LEFT JOIN public.job_titles jt ON p.job_title_id = jt.id
LEFT JOIN public.organizational_structure os ON p.unit_id = os.id
WHERE p.status = 'active';

-- 2. Grant SELECT on the view to authenticated users (RLS will filter)
GRANT SELECT ON public.profiles_compensation_directory TO authenticated;

-- 3. Add comment explaining security model
COMMENT ON VIEW public.profiles_compensation_directory IS 
'Compensation directory view with security_invoker=on. Access is filtered by profiles RLS policies - users can only see profiles within their own company.';