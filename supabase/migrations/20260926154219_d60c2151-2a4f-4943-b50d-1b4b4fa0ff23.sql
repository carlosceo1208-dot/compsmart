CREATE OR REPLACE FUNCTION public.talent_link_or_create_job_title(
  _title text, _cbo text, _job_family text, _grade text,
  _responsibilities text, _hard_skills text, _soft_skills text, _experience text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _company uuid := public.get_user_company_id();
  _existing uuid;
  _new uuid;
BEGIN
  IF _company IS NULL OR NOT (
       public.has_role(auth.uid(),'super_admin')
       OR (public.has_module('talent') AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr_manager')))
     ) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;
  IF coalesce(trim(_title),'') = '' OR coalesce(trim(_job_family),'') = '' OR coalesce(trim(_grade),'') = '' THEN
    RAISE EXCEPTION 'Título, família e nível são obrigatórios';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(_company::text || 'job_titles'));

  SELECT id INTO _existing FROM public.job_titles
  WHERE root_company_id = _company
    AND ((coalesce(_cbo,'') <> '' AND cbo = _cbo)
      OR lower(public.unaccent_safe(title)) = lower(public.unaccent_safe(_title)))
  LIMIT 1;

  IF _existing IS NOT NULL THEN
    RETURN jsonb_build_object('id', _existing, 'existed', true);
  END IF;

  INSERT INTO public.job_titles (root_company_id, title, cbo, code, job_family, grade, median_points,
    main_responsibilities, hard_skills, soft_skills, required_experience, is_active)
  VALUES (_company, left(trim(_title),200), coalesce(_cbo,''), 'RS-' || substr(md5(random()::text),1,6),
    left(_job_family,100), left(_grade,50), 0, _responsibilities, _hard_skills, _soft_skills, _experience, true)
  RETURNING id INTO _new;
  RETURN jsonb_build_object('id', _new, 'existed', false);
END $$;
REVOKE EXECUTE ON FUNCTION public.talent_link_or_create_job_title(text,text,text,text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.talent_link_or_create_job_title(text,text,text,text,text,text,text,text) TO authenticated;