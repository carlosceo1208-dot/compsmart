
DROP POLICY IF EXISTS "Managers can view direct reports profiles" ON public.profiles;

CREATE OR REPLACE FUNCTION public.get_manager_direct_reports()
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  phone text,
  status text,
  job_title text,
  grade text,
  salary numeric,
  salary_range_percentage numeric,
  performance_rating numeric,
  variable_salary numeric,
  unit_id uuid,
  manager_id uuid,
  job_title_id uuid,
  has_system_access boolean,
  employee_number text,
  benefits_value numeric,
  short_term_incentive numeric,
  long_term_incentive numeric,
  root_company_id uuid,
  avatar_url text,
  hire_date date,
  termination_date date,
  preferred_language text,
  age_range text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id, p.full_name, p.email, p.phone, p.status, p.job_title, p.grade,
    p.salary, p.salary_range_percentage, p.performance_rating, p.variable_salary,
    p.unit_id, p.manager_id, p.job_title_id, p.has_system_access, p.employee_number,
    p.benefits_value, p.short_term_incentive, p.long_term_incentive,
    p.root_company_id, p.avatar_url, p.hire_date, p.termination_date,
    p.preferred_language, p.age_range, p.created_at, p.updated_at
  FROM public.profiles p
  WHERE p.manager_id = auth.uid()
    AND p.root_company_id = public.get_user_company_id();
$$;

REVOKE EXECUTE ON FUNCTION public.get_manager_direct_reports() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_manager_direct_reports() TO authenticated;
