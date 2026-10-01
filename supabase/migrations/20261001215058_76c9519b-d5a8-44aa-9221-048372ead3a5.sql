CREATE OR REPLACE FUNCTION public.nr1_inteligencia_unidades(p_company uuid, p_inicio date DEFAULT NULL, p_fim date DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_pot boolean; v_ins boolean; v_diag record; v_units jsonb; v_ocultas int; v_grupos jsonb; v_g_ocultos int; v_saude numeric;
BEGIN
  IF auth.uid() IS NULL OR p_company IS NULL THEN RETURN jsonb_build_object('acesso','negado'); END IF;
  IF NOT (public.is_super_admin() OR ((public.rh_admin_da_empresa(p_company) OR (public.nr1_consultor_liberado() AND public.get_user_company_id() = p_company)) AND public.has_module('nr1'))) THEN
    PERFORM public._nr1_segpsi_negar(p_company, 'inteligencia', 'sem permissão para a empresa');
    RAISE WARNING 'nr1_inteligencia_unidades: acesso negado';
    RETURN jsonb_build_object('acesso','negado');
  END IF;
  v_pot := public.is_super_admin() OR public.has_module('potencial-sucessao');
  v_ins := public.is_super_admin() OR public.has_module('insight');

  SELECT id, ciclo_nome, score_geral, scores_dimensao, total_respondentes, periodo_fim INTO v_diag
  FROM public.nr1_diagnosticos
  WHERE company_id = p_company AND status = 'concluido'
    AND (p_inicio IS NULL OR periodo_fim >= p_inicio) AND (p_fim IS NULL OR periodo_fim <= p_fim)
  ORDER BY created_at DESC LIMIT 1;
  v_saude := CASE WHEN v_diag.score_geral IS NULL THEN NULL ELSE round(100 - v_diag.score_geral, 1) END;

  DROP TABLE IF EXISTS _it;
  CREATE TEMP TABLE _it ON COMMIT DROP AS
    SELECT DISTINCT ON (p.id) p.id, p.unit_id, p.salary,
      pe.final_score perf, public.calculate_9box_position(pe.final_score, pe.potential_score) box
    FROM public.profiles p
    LEFT JOIN public.performance_evaluations pe ON pe.employee_id = p.id
    WHERE p.root_company_id = p_company AND p.status = 'active' AND p.employee_number IS NOT NULL
    ORDER BY p.id, pe.created_at DESC NULLS LAST;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'unit_id', u.unit_id, 'unit_name', COALESCE(os.name, 'Sem unidade'), 'pessoas', u.n,
      'criticos', CASE WHEN v_pot THEN u.crit END, 'estrelas', CASE WHEN v_pot THEN u.est END,
      'perf_media', u.perf,
      'salario_medio', CASE WHEN v_ins THEN u.sal END,
      'salario_medio_estrelas', CASE WHEN v_pot AND v_ins THEN u.sal_est END)), '[]'::jsonb)
  INTO v_units
  FROM (SELECT unit_id, count(*) n,
          count(*) FILTER (WHERE box BETWEEN 1 AND 3) crit, count(*) FILTER (WHERE box BETWEEN 7 AND 9) est,
          round(avg(perf)::numeric, 2) perf, round(avg(salary)::numeric, 2) sal,
          round(avg(salary) FILTER (WHERE box BETWEEN 7 AND 9)::numeric, 2) sal_est
        FROM _it GROUP BY unit_id HAVING count(*) >= 5) u
  LEFT JOIN public.organizational_structure os ON os.id = u.unit_id;
  SELECT count(*) INTO v_ocultas FROM (SELECT unit_id FROM _it GROUP BY 1 HAVING count(*) < 5) o;

  -- Grupo autodeclarado: recorte separado, só contagem + nota de saúde do check-up, sem 9Box/salário.
  SELECT COALESCE(jsonb_agg(jsonb_build_object('grupo', g, 'pessoas', n, 'saude', sc) ORDER BY g), '[]'::jsonb) INTO v_grupos
  FROM (SELECT g, count(*) n, round(avg(s)::numeric, 1) sc FROM (
          SELECT j.user_id, trim(j.grupo) g, avg((c.humor_1_10 - 1) * 100.0 / 9) s
          FROM public.nr1_jornadas j JOIN public.nr1_checkins_semanais c ON c.jornada_id = j.id
          WHERE j.company_id = p_company AND NULLIF(trim(j.grupo),'') IS NOT NULL AND c.criado_em >= now() - interval '84 days'
          GROUP BY 1,2) a GROUP BY g HAVING count(*) >= 5) z;
  SELECT count(*) INTO v_g_ocultos FROM (
    SELECT trim(j.grupo) FROM public.nr1_jornadas j JOIN public.nr1_checkins_semanais c ON c.jornada_id = j.id
    WHERE j.company_id = p_company AND NULLIF(trim(j.grupo),'') IS NOT NULL AND c.criado_em >= now() - interval '84 days'
    GROUP BY 1 HAVING count(DISTINCT j.user_id) < 5) o;

  INSERT INTO public.nr1_access_log (company_id, actor_user_id, actor_role, action, resource, blocked, k_value, filters)
  VALUES (p_company, auth.uid(), 'authenticated', 'view_dashboard', 'inteligencia', false, 5, jsonb_build_object('inicio', p_inicio, 'fim', p_fim));

  RETURN jsonb_build_object('acesso','ok','k_minimo',5,'inclui_potencial',v_pot,'inclui_remuneracao',v_ins,
    'diagnostico', CASE WHEN v_diag.id IS NULL THEN NULL ELSE jsonb_build_object('id',v_diag.id,'nome',v_diag.ciclo_nome,'risco',v_diag.score_geral,'saude',v_saude,'dimensoes',v_diag.scores_dimensao,'respondentes',v_diag.total_respondentes) END,
    'unidades', v_units, 'unidades_ocultas', v_ocultas, 'grupos', v_grupos, 'grupos_ocultos', v_g_ocultos);
END $$;

CREATE OR REPLACE FUNCTION public.nr1_clima_correlacao(p_company uuid)
RETURNS SETOF public.vw_nr1_clima_copsoq_correlacao LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.uid() IS NULL OR p_company IS NULL THEN RETURN; END IF;
  IF NOT (public.is_super_admin() OR ((public.rh_admin_da_empresa(p_company) OR (public.nr1_consultor_liberado() AND public.get_user_company_id() = p_company)) AND public.has_module('nr1') AND public.has_module('clima'))) THEN
    PERFORM public._nr1_segpsi_negar(p_company, 'inteligencia_clima', 'sem permissão ou sem módulo Clima');
    RAISE WARNING 'nr1_clima_correlacao: acesso negado';
    RETURN;
  END IF;
  RETURN QUERY SELECT * FROM public.vw_nr1_clima_copsoq_correlacao v WHERE v.company_id = p_company
    AND v.clima_respondentes >= 5 AND v.diag_respondentes >= 5;
END $$;

REVOKE ALL ON FUNCTION public.nr1_inteligencia_unidades(uuid, date, date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.nr1_clima_correlacao(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nr1_inteligencia_unidades(uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nr1_clima_correlacao(uuid) TO authenticated;