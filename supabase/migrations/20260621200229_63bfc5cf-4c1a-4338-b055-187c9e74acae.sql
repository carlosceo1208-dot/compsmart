
CREATE POLICY "nr1_terc_pgr_update" ON public.nr1_terceiros_pgr
FOR UPDATE TO authenticated
USING ((company_id = get_user_company_id()) AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]))
WITH CHECK ((company_id = get_user_company_id()) AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]));

DROP POLICY IF EXISTS "Authenticated users can view permissions" ON public.permissions;
CREATE POLICY "Admins can view permissions" ON public.permissions
FOR SELECT TO authenticated
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role]));
