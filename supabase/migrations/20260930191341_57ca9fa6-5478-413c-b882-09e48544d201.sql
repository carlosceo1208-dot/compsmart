CREATE OR REPLACE FUNCTION public.talent_sugerir_faixa(_company uuid, _titulo text, _cbo text, _grade text, _cargo_id uuid, _pontos numeric DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_uid uuid := auth.uid();
  n_tit text; n_cbo text := regexp_replace(coalesce(_cbo,''),'\D','','g'); n_grade text;
  v_pts numeric := _pontos; v_range uuid; v_min numeric; v_max numeric; v_fonte text; v_tipo text;
  v_n int;
BEGIN
  IF v_uid IS NULL OR _company IS NULL OR NOT public.rh_admin_da_empresa(_company) THEN
    RAISE LOG 'talent_sugerir_faixa recusado: user=% company=%', v_uid, _company;
    RAISE EXCEPTION 'Sem permissão para sugerir faixa desta empresa' USING ERRCODE = '42501';
  END IF;
  n_tit := lower(trim(translate(coalesce(_titulo,''),'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ','aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC')));
  n_grade := lower(trim(coalesce(_grade,'')));
  IF _cargo_id IS NOT NULL THEN
    SELECT coalesce(nullif(n_grade,''), lower(coalesce(grade,''))), salary_range_id, coalesce(v_pts, hay_total_points, median_points)
      INTO n_grade, v_range, v_pts FROM job_titles WHERE id=_cargo_id AND root_company_id=_company;
  END IF;

  -- Candidatos da pesquisa: empresa primeiro, depois global
  FOR v_tipo IN SELECT unnest(ARRAY['empresa','global']) LOOP
    CREATE TEMP TABLE IF NOT EXISTS _sf(q1 numeric, q3 numeric, g text, t text) ON COMMIT DROP;
    TRUNCATE _sf;
    INSERT INTO _sf SELECT d.q1_value, d.q3_value, lower(coalesce(d.grade,'')),
      lower(trim(translate(coalesce(d.job_title,''),'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ','aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC')))
    FROM survey_data d JOIN survey_tables s ON s.id=d.survey_table_id
    WHERE s.is_active AND d.q1_value>0 AND d.q3_value>0
      AND ((v_tipo='empresa' AND s.root_company_id=_company) OR (v_tipo='global' AND s.root_company_id IS NULL))
      AND ((n_cbo<>'' AND regexp_replace(coalesce(d.job_code,''),'\D','','g')=n_cbo) OR n_tit<>'');
    -- 1 CBO
    IF n_cbo<>'' THEN
      SELECT q1,q3 INTO v_min,v_max FROM _sf s2 WHERE EXISTS(SELECT 1) AND false; -- placeholder
    END IF;
    SELECT q1,q3 INTO v_min,v_max FROM survey_data d JOIN survey_tables s ON s.id=d.survey_table_id
      WHERE n_cbo<>'' AND s.is_active AND d.q1_value>0 AND d.q3_value>0
        AND ((v_tipo='empresa' AND s.root_company_id=_company) OR (v_tipo='global' AND s.root_company_id IS NULL))
        AND regexp_replace(coalesce(d.job_code,''),'\D','','g')=n_cbo
      ORDER BY (lower(coalesce(d.grade,''))=n_grade) DESC LIMIT 1;
    -- 2 nome exato, depois parcial único
    IF v_min IS NULL AND length(n_tit)>=2 THEN
      SELECT q1,q3 INTO v_min,v_max FROM _sf WHERE t=n_tit ORDER BY (g=n_grade) DESC LIMIT 1;
      IF v_min IS NULL THEN
        SELECT count(DISTINCT t) INTO v_n FROM _sf WHERE length(t)>=3 AND (position(n_tit in t)>0 OR position(t in n_tit)>0);
        IF v_n=1 THEN
          SELECT q1,q3 INTO v_min,v_max FROM _sf WHERE length(t)>=3 AND (position(n_tit in t)>0 OR position(t in n_tit)>0) ORDER BY (g=n_grade) DESC LIMIT 1;
        END IF;
      END IF;
    END IF;
    IF v_min IS NOT NULL THEN
      v_fonte := CASE v_tipo WHEN 'empresa' THEN 'dados da empresa' ELSE 'pesquisa de mercado' END;
      EXIT;
    END IF;
  END LOOP;

  -- 3 tabela salarial do cargo (ligado, por CBO, nome ou pontos ±10%)
  IF v_min IS NULL THEN
    IF v_range IS NULL THEN
      SELECT salary_range_id INTO v_range FROM job_titles j WHERE j.root_company_id=_company AND j.salary_range_id IS NOT NULL
        AND ((n_cbo<>'' AND regexp_replace(coalesce(j.cbo,''),'\D','','g')=n_cbo)
          OR lower(trim(translate(j.title,'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ','aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC')))=n_tit)
        ORDER BY (lower(coalesce(j.grade,''))=n_grade) DESC LIMIT 1;
    END IF;
    IF v_range IS NULL AND v_pts IS NOT NULL AND v_pts>0 THEN
      SELECT salary_range_id INTO v_range FROM job_titles j WHERE j.root_company_id=_company AND j.salary_range_id IS NOT NULL
        AND coalesce(j.hay_total_points, j.median_points) BETWEEN v_pts*0.9 AND v_pts*1.1
        ORDER BY abs(coalesce(j.hay_total_points, j.median_points)-v_pts) LIMIT 1;
    END IF;
    IF v_range IS NOT NULL THEN
      SELECT min_value, max_value INTO v_min, v_max FROM salary_ranges WHERE id=v_range AND min_value>0 AND max_value>0;
      IF v_min IS NOT NULL THEN v_fonte := 'tabela salarial'; END IF;
    END IF;
  END IF;

  IF v_min IS NULL THEN RETURN NULL; END IF;
  RETURN jsonb_build_object('min', round(v_min), 'max', round(v_max), 'fonte', v_fonte);
END $$;
REVOKE ALL ON FUNCTION public.talent_sugerir_faixa(uuid,text,text,text,uuid,numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.talent_sugerir_faixa(uuid,text,text,text,uuid,numeric) TO authenticated, service_role;