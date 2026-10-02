CREATE OR REPLACE FUNCTION public.nr1_terceiros_pode_gerir(_company uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT _company IS NOT NULL AND _company = public.get_user_company_id() AND (
    public.is_super_admin(auth.uid())
    OR (public.has_module('nr1') AND (
      public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role])
      OR public.consultor_dono_ativo(_company)))
  )
$$;

DROP POLICY IF EXISTS nr1_terc_select ON public.nr1_terceiros;
DROP POLICY IF EXISTS nr1_terc_insert ON public.nr1_terceiros;
DROP POLICY IF EXISTS nr1_terc_update ON public.nr1_terceiros;
DROP POLICY IF EXISTS nr1_terc_delete ON public.nr1_terceiros;
CREATE POLICY nr1_terc_select ON public.nr1_terceiros FOR SELECT TO authenticated USING (public.nr1_terceiros_pode_gerir(company_id));
CREATE POLICY nr1_terc_insert ON public.nr1_terceiros FOR INSERT TO authenticated WITH CHECK (public.nr1_terceiros_pode_gerir(company_id));
CREATE POLICY nr1_terc_update ON public.nr1_terceiros FOR UPDATE TO authenticated USING (public.nr1_terceiros_pode_gerir(company_id)) WITH CHECK (public.nr1_terceiros_pode_gerir(company_id));
CREATE POLICY nr1_terc_delete ON public.nr1_terceiros FOR DELETE TO authenticated USING (company_id = public.get_user_company_id() AND (public.is_super_admin(auth.uid()) OR (public.has_module('nr1') AND public.has_role(auth.uid(),'admin'::app_role))));

DROP POLICY IF EXISTS nr1_terc_pgr_select ON public.nr1_terceiros_pgr;
DROP POLICY IF EXISTS nr1_terc_pgr_insert ON public.nr1_terceiros_pgr;
DROP POLICY IF EXISTS nr1_terc_pgr_update ON public.nr1_terceiros_pgr;
DROP POLICY IF EXISTS nr1_terc_pgr_delete ON public.nr1_terceiros_pgr;
CREATE POLICY nr1_terc_pgr_select ON public.nr1_terceiros_pgr FOR SELECT TO authenticated USING (public.nr1_terceiros_pode_gerir(company_id));
CREATE POLICY nr1_terc_pgr_insert ON public.nr1_terceiros_pgr FOR INSERT TO authenticated WITH CHECK (public.nr1_terceiros_pode_gerir(company_id));
CREATE POLICY nr1_terc_pgr_update ON public.nr1_terceiros_pgr FOR UPDATE TO authenticated USING (public.nr1_terceiros_pode_gerir(company_id)) WITH CHECK (public.nr1_terceiros_pode_gerir(company_id));
CREATE POLICY nr1_terc_pgr_delete ON public.nr1_terceiros_pgr FOR DELETE TO authenticated USING (company_id = public.get_user_company_id() AND (public.is_super_admin(auth.uid()) OR (public.has_module('nr1') AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role]))));

DROP POLICY IF EXISTS nr1_pgr_storage_select ON storage.objects;
DROP POLICY IF EXISTS nr1_pgr_storage_insert ON storage.objects;
DROP POLICY IF EXISTS nr1_pgr_storage_delete ON storage.objects;
DROP POLICY IF EXISTS "Admin/HR update nr1-pgr-docs in their company" ON storage.objects;
CREATE POLICY nr1_pgr_storage_select ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'nr1-pgr-docs' AND public.nr1_terceiros_pode_gerir(((storage.foldername(name))[1])::uuid));
CREATE POLICY nr1_pgr_storage_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'nr1-pgr-docs' AND public.nr1_terceiros_pode_gerir(((storage.foldername(name))[1])::uuid));
CREATE POLICY nr1_pgr_storage_update ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'nr1-pgr-docs' AND public.nr1_terceiros_pode_gerir(((storage.foldername(name))[1])::uuid));
CREATE POLICY nr1_pgr_storage_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'nr1-pgr-docs' AND ((storage.foldername(name))[1]) = public.get_user_company_id()::text AND (public.is_super_admin(auth.uid()) OR (public.has_module('nr1') AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role]))));