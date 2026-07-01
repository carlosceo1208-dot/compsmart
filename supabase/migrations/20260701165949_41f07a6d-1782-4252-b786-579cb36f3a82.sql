ALTER TABLE public.salary_tables
  DROP CONSTRAINT IF EXISTS salary_tables_name_key;

CREATE UNIQUE INDEX IF NOT EXISTS salary_tables_company_name_unique
  ON public.salary_tables (root_company_id, lower(trim(name)))
  WHERE is_template = false;

CREATE UNIQUE INDEX IF NOT EXISTS salary_tables_template_name_unique
  ON public.salary_tables (lower(trim(name)))
  WHERE is_template = true;