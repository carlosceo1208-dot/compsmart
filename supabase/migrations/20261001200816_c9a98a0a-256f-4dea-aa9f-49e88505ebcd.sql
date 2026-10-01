ALTER TABLE public.nr1_jornadas ADD COLUMN IF NOT EXISTS grupo text;

CREATE OR REPLACE FUNCTION public.nr1_grupos_empresa()
RETURNS TABLE(grupo text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT trim(g) FROM (
    SELECT gg.grupo g FROM public.nr1_grupo_gestores gg WHERE gg.company_id = public.get_user_company_id()
    UNION
    SELECT cv.grupo FROM public.nr1_convites cv JOIN public.nr1_diagnosticos d ON d.id = cv.diagnostico_id
     WHERE d.company_id = public.get_user_company_id()
  ) s WHERE auth.uid() IS NOT NULL AND public.has_module('nr1') AND nullif(trim(g),'') IS NOT NULL ORDER BY 1;
$$;
REVOKE ALL ON FUNCTION public.nr1_grupos_empresa() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.nr1_grupos_empresa() TO authenticated;

CREATE OR REPLACE FUNCTION public.nr1_checkup_agregado(p_company uuid, p_dias integer DEFAULT 84)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_emp jsonb; v_areas jsonb; v_tend jsonb; v_sem int; v_total int; v_ocultas int;
BEGIN
  IF auth.uid() IS NULL OR p_company IS NULL THEN RETURN jsonb_build_object('acesso','negado'); END IF;
  IF NOT (public.is_super_admin() OR (public.rh_admin_da_empresa(p_company) AND public.has_module('nr1'))) THEN
    PERFORM public._nr1_segpsi_negar(p_company, 'checkup', 'sem permissão para a empresa');
    RETURN jsonb_build_object('acesso','negado','motivo','Acesso negado.');
  END IF;

  DROP TABLE IF EXISTS _ck;
  CREATE TEMP TABLE _ck ON COMMIT DROP AS
    SELECT j.user_id,
           COALESCE(NULLIF(trim(p.department),''), NULLIF(trim(j.grupo),'')) AS area,
           CASE WHEN NULLIF(trim(p.department),'') IS NOT NULL THEN 'area'
                WHEN NULLIF(trim(j.grupo),'') IS NOT NULL THEN 'grupo' END AS tipo,
           date_trunc('week', c.criado_em)::date AS semana_ini,
           (c.humor_1_10 - 1) * 100.0 / 9 AS score
    FROM public.nr1_checkins_semanais c
    JOIN public.nr1_jornadas j ON j.id = c.jornada_id
    LEFT JOIN public.profiles p ON p.id = j.user_id
    WHERE j.company_id = p_company AND c.criado_em >= now() - make_interval(days => GREATEST(p_dias,7));

  SELECT count(DISTINCT user_id) INTO v_total FROM _ck;
  SELECT count(DISTINCT user_id) INTO v_sem FROM _ck WHERE area IS NULL;

  IF v_total >= 5 THEN
    SELECT jsonb_build_object('dados_suficientes', true, 'pessoas', v_total, 'score', round(avg(s)::numeric,1))
      INTO v_emp FROM (SELECT user_id, avg(score) s FROM _ck GROUP BY 1) x;
    SELECT COALESCE(jsonb_agg(jsonb_build_object('semana', semana_ini, 'score', sc, 'pessoas', n) ORDER BY semana_ini), '[]'::jsonb)
      INTO v_tend FROM (SELECT semana_ini, round(avg(score)::numeric,1) sc, count(DISTINCT user_id) n FROM _ck GROUP BY 1 HAVING count(DISTINCT user_id) >= 5) t;
  ELSE
    v_emp := jsonb_build_object('dados_suficientes', false);
    v_tend := '[]'::jsonb;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('area', area, 'tipo', tipo, 'pessoas', n, 'score', sc) ORDER BY tipo, area), '[]'::jsonb)
    INTO v_areas FROM (SELECT tipo, area, count(DISTINCT user_id) n, round(avg(s)::numeric,1) sc
      FROM (SELECT user_id, tipo, area, avg(score) s FROM _ck WHERE area IS NOT NULL GROUP BY 1,2,3) a
      GROUP BY tipo, area HAVING count(DISTINCT user_id) >= 5) z;
  SELECT count(*) INTO v_ocultas FROM (SELECT tipo, area FROM _ck WHERE area IS NOT NULL GROUP BY 1,2 HAVING count(DISTINCT user_id) < 5) o;

  INSERT INTO public.nr1_access_log (company_id, actor_user_id, actor_role, action, resource, blocked, k_value, filters)
  VALUES (p_company, auth.uid(), 'authenticated', 'view_dashboard', 'checkup', false, 5, jsonb_build_object('dias', p_dias));

  RETURN jsonb_build_object('acesso','empresa','k_minimo',5,'empresa',v_emp,'areas',v_areas,
    'areas_ocultas', v_ocultas,
    'sem_area', CASE WHEN v_total >= 5 THEN v_sem ELSE NULL END,
    'sem_recorte', CASE WHEN v_total >= 5 THEN v_sem ELSE NULL END,
    'tendencia', v_tend);
END $function$;