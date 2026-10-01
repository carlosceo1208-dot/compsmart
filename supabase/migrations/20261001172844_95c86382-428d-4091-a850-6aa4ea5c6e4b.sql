-- Trava NR-1 em profundidade: jornada, mensagens e check-ups
DROP POLICY IF EXISTS "user manages own jornada" ON public.nr1_jornadas;
CREATE POLICY "user manages own jornada" ON public.nr1_jornadas FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.has_module('nr1'))
  WITH CHECK (auth.uid() = user_id AND public.has_module('nr1'));

DROP POLICY IF EXISTS "user manages own jornada msgs" ON public.nr1_jornada_mensagens;
CREATE POLICY "user manages own jornada msgs" ON public.nr1_jornada_mensagens FOR ALL TO authenticated
  USING (public.has_module('nr1') AND EXISTS (SELECT 1 FROM public.nr1_jornadas j WHERE j.id = nr1_jornada_mensagens.jornada_id AND j.user_id = auth.uid()))
  WITH CHECK (public.has_module('nr1') AND EXISTS (SELECT 1 FROM public.nr1_jornadas j WHERE j.id = nr1_jornada_mensagens.jornada_id AND j.user_id = auth.uid()));

DROP POLICY IF EXISTS "user manages own checkins" ON public.nr1_checkins_semanais;
CREATE POLICY "user manages own checkins" ON public.nr1_checkins_semanais FOR ALL TO authenticated
  USING (public.has_module('nr1') AND EXISTS (SELECT 1 FROM public.nr1_jornadas j WHERE j.id = nr1_checkins_semanais.jornada_id AND j.user_id = auth.uid()))
  WITH CHECK (public.has_module('nr1') AND EXISTS (SELECT 1 FROM public.nr1_jornadas j WHERE j.id = nr1_checkins_semanais.jornada_id AND j.user_id = auth.uid()));

-- Visão agregada do check-up (RH/admin da empresa com NR-1, ou super admin). k=5 por área e empresa.
CREATE OR REPLACE FUNCTION public.nr1_checkup_agregado(p_company uuid, p_dias integer DEFAULT 84)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_emp jsonb; v_areas jsonb; v_tend jsonb; v_sem_area int; v_total int; v_ocultas int;
BEGIN
  IF auth.uid() IS NULL OR p_company IS NULL THEN RETURN jsonb_build_object('acesso','negado'); END IF;
  IF NOT (public.is_super_admin() OR (public.rh_admin_da_empresa(p_company) AND public.has_module('nr1'))) THEN
    PERFORM public._nr1_segpsi_negar(p_company, 'checkup', 'sem permissão para a empresa');
    RETURN jsonb_build_object('acesso','negado','motivo','Acesso negado.');
  END IF;

  CREATE TEMP TABLE IF NOT EXISTS _ck ON COMMIT DROP AS SELECT 1 x WHERE false;
  DROP TABLE IF EXISTS _ck;
  CREATE TEMP TABLE _ck ON COMMIT DROP AS
    SELECT j.user_id, NULLIF(trim(p.department),'') AS area, c.semana,
           date_trunc('week', c.criado_em)::date AS semana_ini,
           (c.humor_1_10 - 1) * 100.0 / 9 AS score
    FROM public.nr1_checkins_semanais c
    JOIN public.nr1_jornadas j ON j.id = c.jornada_id
    LEFT JOIN public.profiles p ON p.id = j.user_id
    WHERE j.company_id = p_company AND c.criado_em >= now() - make_interval(days => GREATEST(p_dias,7));

  SELECT count(DISTINCT user_id) INTO v_total FROM _ck;
  SELECT count(DISTINCT user_id) INTO v_sem_area FROM _ck WHERE area IS NULL;

  IF v_total >= 5 THEN
    SELECT jsonb_build_object('dados_suficientes', true, 'pessoas', v_total, 'score', round(avg(s)::numeric,1))
      INTO v_emp FROM (SELECT user_id, avg(score) s FROM _ck GROUP BY 1) x;
    SELECT COALESCE(jsonb_agg(jsonb_build_object('semana', semana_ini, 'score', sc, 'pessoas', n) ORDER BY semana_ini), '[]'::jsonb)
      INTO v_tend FROM (SELECT semana_ini, round(avg(score)::numeric,1) sc, count(DISTINCT user_id) n FROM _ck GROUP BY 1 HAVING count(DISTINCT user_id) >= 5) t;
  ELSE
    v_emp := jsonb_build_object('dados_suficientes', false);
    v_tend := '[]'::jsonb;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('area', area, 'pessoas', n, 'score', sc) ORDER BY area), '[]'::jsonb)
    INTO v_areas FROM (SELECT area, count(DISTINCT user_id) n, round(avg(s)::numeric,1) sc
      FROM (SELECT user_id, area, avg(score) s FROM _ck WHERE area IS NOT NULL GROUP BY 1,2) a
      GROUP BY area HAVING count(DISTINCT user_id) >= 5) z;
  SELECT count(*) INTO v_ocultas FROM (SELECT area FROM _ck WHERE area IS NOT NULL GROUP BY area HAVING count(DISTINCT user_id) < 5) o;

  INSERT INTO public.nr1_access_log (company_id, actor_user_id, actor_role, action, resource, blocked, k_value, filters)
  VALUES (p_company, auth.uid(), 'authenticated', 'view_dashboard', 'checkup', false, 5, jsonb_build_object('dias', p_dias));

  RETURN jsonb_build_object('acesso','empresa','k_minimo',5,'empresa',v_emp,'areas',v_areas,
    'areas_ocultas', v_ocultas, 'sem_area', CASE WHEN v_total >= 5 THEN v_sem_area ELSE NULL END, 'tendencia', v_tend);
END $$;

REVOKE ALL ON FUNCTION public.nr1_checkup_agregado(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.nr1_checkup_agregado(uuid, integer) TO authenticated;