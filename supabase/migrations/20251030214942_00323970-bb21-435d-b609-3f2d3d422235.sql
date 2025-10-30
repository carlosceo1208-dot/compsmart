-- 1) Fix ambiguous id in trigger function
CREATE OR REPLACE FUNCTION public.update_job_title_salary_range()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Buscar a salary_range ativa correspondente ao grade (qualificando a coluna id)
  SELECT sr.id INTO NEW.salary_range_id
  FROM public.salary_ranges AS sr
  JOIN public.salary_tables AS st ON sr.salary_table_id = st.id
  WHERE sr.grade = NEW.grade
    AND st.is_active = true
  LIMIT 1;
  
  RETURN NEW;
END;
$$;

-- 2) Recreate trigger to ensure it exists and uses the updated function
DROP TRIGGER IF EXISTS update_job_title_salary_range_trigger ON public.job_titles;

CREATE TRIGGER update_job_title_salary_range_trigger
BEFORE INSERT OR UPDATE OF grade
ON public.job_titles
FOR EACH ROW
EXECUTE FUNCTION public.update_job_title_salary_range();

-- 3) Drop obsolete job family check constraint if it exists
ALTER TABLE public.job_titles DROP CONSTRAINT IF EXISTS check_job_family;