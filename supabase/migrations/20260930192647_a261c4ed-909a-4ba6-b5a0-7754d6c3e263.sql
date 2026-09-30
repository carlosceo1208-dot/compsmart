CREATE OR REPLACE FUNCTION public.talent_pode_sugerir(_user uuid, _company uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT _user IS NOT NULL AND _company IS NOT NULL AND (
    COALESCE(public.is_super_admin(_user), false)
    OR (public.has_any_role(_user, ARRAY['admin'::app_role,'hr_manager'::app_role])
        AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=_user AND p.root_company_id=_company)));
$$;
REVOKE ALL ON FUNCTION public.talent_pode_sugerir(uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.talent_pode_sugerir(uuid,uuid) TO service_role;

DO $d$
DECLARE src text;
BEGIN
  src := pg_get_functiondef('public.talent_sugerir_faixa(uuid,text,text,text,uuid,numeric)'::regprocedure);
  src := replace(src, 'talent_sugerir_faixa(_company uuid, _titulo text, _cbo text, _grade text, _cargo_id uuid, _pontos numeric DEFAULT NULL::numeric)',
                      'talent_sugerir_faixa(_user uuid, _company uuid, _titulo text, _cbo text, _grade text, _cargo_id uuid, _pontos numeric DEFAULT NULL::numeric)');
  src := replace(src, 'v_uid uuid := auth.uid();', 'v_uid uuid := _user;');
  src := replace(src, 'NOT public.rh_admin_da_empresa(_company)', 'NOT public.talent_pode_sugerir(_user, _company)');
  src := replace(src, 'IF v_min IS NULL THEN RETURN NULL; END IF;', 'IF v_min IS NULL THEN RETURN jsonb_build_object(''min'', NULL, ''max'', NULL, ''fonte'', NULL); END IF;');
  IF position('_user uuid, _company' in src)=0 OR position('talent_pode_sugerir' in src)=0 THEN RAISE EXCEPTION 'replace falhou'; END IF;
  EXECUTE src;
END $d$;
DROP FUNCTION public.talent_sugerir_faixa(uuid,text,text,text,uuid,numeric);
REVOKE ALL ON FUNCTION public.talent_sugerir_faixa(uuid,uuid,text,text,text,uuid,numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.talent_sugerir_faixa(uuid,uuid,text,text,text,uuid,numeric) TO service_role;