DROP POLICY IF EXISTS "View salary ranges (own company or templates)" ON public.salary_ranges;
CREATE POLICY "View salary ranges (own company or templates)" ON public.salary_ranges FOR SELECT TO authenticated
USING (salary_table_id IN (SELECT st.id FROM salary_tables st WHERE
  st.is_template = true
  OR (st.root_company_id = get_user_company_id() AND has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role,'manager'::app_role,'super_admin'::app_role]))
  OR (st.root_company_id IS NULL AND is_super_admin(auth.uid()))));