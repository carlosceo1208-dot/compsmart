-- Security fix: prevent anonymous/public access to salary survey templates/data
-- by requiring authenticated users for SELECT.

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.survey_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_data ENABLE ROW LEVEL SECURITY;

-- Tighten SELECT on survey_tables: templates + own company, but only when logged in
DROP POLICY IF EXISTS "View templates and own surveys" ON public.survey_tables;
CREATE POLICY "View templates and own surveys"
ON public.survey_tables
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    root_company_id IS NULL
    OR root_company_id = get_user_company_id()
  )
);

-- Tighten SELECT on survey_data: rows via table ownership, but only when logged in
DROP POLICY IF EXISTS "View survey data based on table ownership" ON public.survey_data;
CREATE POLICY "View survey data based on table ownership"
ON public.survey_data
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.survey_tables st
    WHERE st.id = survey_data.survey_table_id
      AND (
        st.root_company_id IS NULL
        OR st.root_company_id = get_user_company_id()
      )
  )
);
