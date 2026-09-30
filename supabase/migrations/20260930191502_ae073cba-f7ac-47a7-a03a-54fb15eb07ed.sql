CREATE OR REPLACE FUNCTION public._sf_norm(t text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $$
  SELECT lower(trim(translate(coalesce(t,''),'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ','aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC')))
$$;

CREATE OR REPLACE FUNCTION public.talent_sugerir_faixa(_company uuid, _titulo text, _cbo text, _grade text, _cargo_id uuid, _pontos numeric DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_uid uuid := auth.uid();
  n_tit text := public._sf_norm(_titulo); n_cbo text := regexp_replace(coalesce(_cbo,''),'\D','','g');
  n_grade text := lower(trim(coalesce(_grade,'')));
  v_pts numeric := _pontos; v_range uuid; v_min numeric; v_max numeric; v_fonte text; v_tipo text; v_n int; v_g text;
BEGIN
  IF v_uid IS NULL OR _company IS NULL OR NOT public.rh_admin_da_empresa(_company) THEN
    RAISE LOG 'talent_sugerir_faixa recusado: user=% company=%', v_uid, _company;
    RAISE EXCEPTION 'Sem permissão para sugerir faixa desta empresa' USING ERRCODE = '42501';
  END IF;
  IF _cargo_id IS NOT NULL THEN
    SELECT lower(coalesce(grade,'')), salary_range_id, coalesce(hay_total_points::numeric, median_points)
      INTO v_g, v_range, v_pts FROM job_titles WHERE id=_cargo_id AND root_company_id=_company;
    IF n_grade='' THEN n_grade := coalesce(v_g,''); END IF;
    v_pts := coalesce(_pontos, v_pts);
  END IF;

  FOREACH v_tipo IN ARRAY ARRAY['empresa','global'] LOOP
    WITH base AS (
      SELECT d.q1_value q1, d.q3_value q3, lower(coalesce(d.grade,'')) g, public._sf_norm(d.job_title) t,
             regexp_replace(coalesce(d.job_code,''),'\D','','g') c
      FROM survey_data d JOIN survey_tables s ON s.id=d.survey_table_id
      WHERE s.is_active AND d.q1_value>0 AND d.q3_value>0
        AND ((v_tipo='empresa' AND s.root_company_id=_company) OR (v_tipo='global' AND s.root_company_id IS NULL))
    ), parc AS (SELECT * FROM base WHERE length(t)>=3 AND length(n_tit)>=2 AND (position(n_tit in t)>0 OR position(t in n_tit)>0)),
    cand AS (
      SELECT q1,q3,g,1 p FROM base WHERE n_cbo<>'' AND c=n_cbo
      UNION ALL SELECT q1,q3,g,2 FROM base WHERE length(n_tit)>=2 AND t=n_tit
      UNION ALL SELECT q1,q3,g,3 FROM parc WHERE (SELECT count(DISTINCT t) FROM parc)=1
    )
    SELECT q1,q3 INTO v_min,v_max FROM cand ORDER BY p, (g=n_grade) DESC LIMIT 1;
    IF v_min IS NOT NULL THEN
      v_fonte := CASE v_tipo WHEN 'empresa' THEN 'dados da empresa' ELSE 'pesquisa de mercado' END; EXIT;
    END IF;
  END LOOP;

  IF v_min IS NULL THEN
    IF v_range IS NULL THEN
      SELECT j.salary_range_id INTO v_range FROM job_titles j WHERE j.root_company_id=_company AND j.salary_range_id IS NOT NULL
        AND ((n_cbo<>'' AND regexp_replace(coalesce(j.cbo,''),'\D','','g')=n_cbo) OR (n_tit<>'' AND public._sf_norm(j.title)=n_tit))
        ORDER BY (lower(coalesce(j.grade,''))=n_grade) DESC LIMIT 1;
    END IF;
    IF v_range IS NULL AND coalesce(v_pts,0)>0 THEN
      SELECT j.salary_range_id INTO v_range FROM job_titles j WHERE j.root_company_id=_company AND j.salary_range_id IS NOT NULL
        AND coalesce(j.hay_total_points::numeric, j.median_points) BETWEEN v_pts*0.9 AND v_pts*1.1
        ORDER BY abs(coalesce(j.hay_total_points::numeric, j.median_points)-v_pts) LIMIT 1;
    END IF;
    IF v_range IS NOT NULL THEN
      SELECT min_value, max_value INTO v_min, v_max FROM salary_ranges WHERE id=v_range AND min_value>0 AND max_value>0;
      IF v_min IS NOT NULL THEN v_fonte := 'tabela salarial'; END IF;
    END IF;
  END IF;

  IF v_min IS NULL THEN RETURN NULL; END IF;
  RETURN jsonb_build_object('min', round(v_min), 'max', round(v_max), 'fonte', v_fonte);
END $$;
REVOKE ALL ON FUNCTION public._sf_norm(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public._sf_norm(text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.talent_sugerir_faixa(uuid,text,text,text,uuid,numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.talent_sugerir_faixa(uuid,text,text,text,uuid,numeric) TO authenticated, service_role;