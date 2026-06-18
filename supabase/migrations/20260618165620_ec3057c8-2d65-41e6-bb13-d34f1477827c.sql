
-- 1) Add is_template flag
ALTER TABLE public.salary_tables
  ADD COLUMN IF NOT EXISTS is_template boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_salary_tables_is_template
  ON public.salary_tables(is_template) WHERE is_template = true;

-- 2) Mark Pequenas & Médias as global template, and ensure it's not "active" for any company
UPDATE public.salary_tables
   SET is_template = true,
       is_active = false
 WHERE id = '708e3efc-789f-4636-95ae-df6cbbd6dc2d';

-- 3) Replace SELECT policy on salary_tables to also expose templates to everyone authenticated
DROP POLICY IF EXISTS "Users view own company salary tables" ON public.salary_tables;
CREATE POLICY "Users view own company or template salary tables"
  ON public.salary_tables
  FOR SELECT
  TO authenticated
  USING (
    is_template = true
    OR root_company_id = get_user_company_id()
  );

-- 4) Restrict management policy so templates can only be managed by super_admin
DROP POLICY IF EXISTS "Admins and HR manage own company salary tables" ON public.salary_tables;
CREATE POLICY "Admins and HR manage own company salary tables"
  ON public.salary_tables
  FOR ALL
  TO authenticated
  USING (
    (is_template = false
      AND root_company_id = get_user_company_id()
      AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]))
    OR (is_template = true AND has_role(auth.uid(), 'super_admin'::app_role))
  )
  WITH CHECK (
    (is_template = false
      AND root_company_id = get_user_company_id()
      AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]))
    OR (is_template = true AND has_role(auth.uid(), 'super_admin'::app_role))
  );

-- 5) Allow viewing salary_ranges that belong to template tables (read-only for everyone authenticated)
DROP POLICY IF EXISTS "Admin, HR, and Managers can view salary ranges" ON public.salary_ranges;
CREATE POLICY "View salary ranges (own company or templates)"
  ON public.salary_ranges
  FOR SELECT
  TO authenticated
  USING (
    salary_table_id IN (
      SELECT id FROM public.salary_tables
       WHERE is_template = true
          OR root_company_id = get_user_company_id()
          OR root_company_id IS NULL
    )
  );

-- 6) Prevent the "single active" trigger from accidentally activating a template across companies
-- (templates have is_active=false; the existing trigger logic remains valid)
