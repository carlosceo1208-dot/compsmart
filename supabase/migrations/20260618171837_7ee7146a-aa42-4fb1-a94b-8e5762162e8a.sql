CREATE OR REPLACE FUNCTION public.update_job_title_salary_range()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT sr.id INTO NEW.salary_range_id
  FROM public.salary_ranges AS sr
  JOIN public.salary_tables AS st ON sr.salary_table_id = st.id
  WHERE sr.grade = NEW.grade
    AND st.is_active = true
    AND COALESCE(st.is_template, false) = false
    AND st.root_company_id = NEW.root_company_id
  ORDER BY st.created_at DESC
  LIMIT 1;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_job_title_salary_range_trigger ON public.job_titles;

WITH active_ranges AS (
  SELECT DISTINCT ON (st.root_company_id, sr.grade)
    st.root_company_id,
    sr.grade,
    sr.id AS salary_range_id
  FROM public.salary_tables st
  JOIN public.salary_ranges sr ON sr.salary_table_id = st.id
  WHERE st.is_active = true
    AND COALESCE(st.is_template, false) = false
    AND st.root_company_id IS NOT NULL
  ORDER BY st.root_company_id, sr.grade, st.created_at DESC
)
UPDATE public.job_titles jt
SET
  salary_range_id = ar.salary_range_id,
  updated_at = now()
FROM active_ranges ar
WHERE jt.root_company_id = ar.root_company_id
  AND jt.grade = ar.grade;