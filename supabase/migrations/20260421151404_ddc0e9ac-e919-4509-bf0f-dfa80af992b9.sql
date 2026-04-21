-- =====================================================
-- FASE 2.7.3 — INSIGHT (MARKET BENCHMARK)
-- =====================================================

-- 1) Competitividade por colaborador vs. mercado
CREATE OR REPLACE FUNCTION public.get_market_competitiveness()
RETURNS TABLE (
  employee_id uuid,
  employee_name text,
  job_title text,
  grade text,
  unit_id uuid,
  unit_name text,
  internal_salary numeric,
  market_median numeric,
  market_q1 numeric,
  market_q3 numeric,
  competitiveness_pct numeric,
  market_position text,
  survey_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_company uuid;
BEGIN
  v_company := get_user_company_id();

  IF v_company IS NULL OR NOT has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]) THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH active_survey AS (
    SELECT st.id, st.name
    FROM survey_tables st
    WHERE (st.root_company_id = v_company OR st.root_company_id IS NULL)
      AND st.is_active = true
    ORDER BY st.root_company_id NULLS LAST, st.effective_year DESC, st.effective_month DESC
    LIMIT 1
  )
  SELECT
    p.id,
    p.full_name,
    jt.title,
    p.grade,
    p.unit_id,
    os.name,
    p.salary,
    sd.median_value,
    sd.q1_value,
    sd.q3_value,
    ROUND(((p.salary / NULLIF(sd.median_value, 0)) * 100)::numeric, 2),
    CASE
      WHEN p.salary < sd.q1_value THEN 'below_market'
      WHEN p.salary BETWEEN sd.q1_value AND sd.median_value THEN 'competitive_low'
      WHEN p.salary BETWEEN sd.median_value AND sd.q3_value THEN 'competitive_high'
      ELSE 'above_market'
    END,
    asv.name
  FROM profiles p
  JOIN job_titles jt ON jt.id = p.job_title_id
  LEFT JOIN organizational_structure os ON os.id = p.unit_id
  CROSS JOIN active_survey asv
  JOIN survey_data sd ON sd.survey_table_id = asv.id
                     AND sd.grade = p.grade
                     AND LOWER(sd.job_title) = LOWER(jt.title)
  WHERE p.root_company_id = v_company
    AND p.is_active = true
    AND p.salary > 0;
END;
$$;

-- 2) Alertas de defasagem
CREATE OR REPLACE FUNCTION public.get_market_alerts(threshold_pct numeric DEFAULT 15)
RETURNS TABLE (
  employee_id uuid,
  employee_name text,
  job_title text,
  grade text,
  internal_salary numeric,
  market_median numeric,
  gap_pct numeric,
  gap_amount numeric,
  severity text,
  recommendation text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_company uuid;
BEGIN
  v_company := get_user_company_id();

  IF v_company IS NULL OR NOT has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    mc.employee_id,
    mc.employee_name,
    mc.job_title,
    mc.grade,
    mc.internal_salary,
    mc.market_median,
    ROUND((((mc.market_median - mc.internal_salary) / NULLIF(mc.market_median, 0)) * 100)::numeric, 2),
    ROUND((mc.market_median - mc.internal_salary)::numeric, 2),
    CASE
      WHEN ((mc.market_median - mc.internal_salary) / NULLIF(mc.market_median, 0)) * 100 >= 25 THEN 'critical'
      WHEN ((mc.market_median - mc.internal_salary) / NULLIF(mc.market_median, 0)) * 100 >= 20 THEN 'high'
      WHEN ((mc.market_median - mc.internal_salary) / NULLIF(mc.market_median, 0)) * 100 >= threshold_pct THEN 'medium'
      ELSE 'low'
    END,
    CASE
      WHEN ((mc.market_median - mc.internal_salary) / NULLIF(mc.market_median, 0)) * 100 >= 25
        THEN 'Ajuste urgente recomendado — risco alto de turnover'
      WHEN ((mc.market_median - mc.internal_salary) / NULLIF(mc.market_median, 0)) * 100 >= 20
        THEN 'Avaliar reajuste no próximo ciclo de mérito'
      ELSE 'Monitorar competitividade'
    END
  FROM get_market_competitiveness() mc
  WHERE mc.internal_salary < mc.market_median
    AND ((mc.market_median - mc.internal_salary) / NULLIF(mc.market_median, 0)) * 100 >= threshold_pct
  ORDER BY ((mc.market_median - mc.internal_salary) / NULLIF(mc.market_median, 0)) DESC;
END;
$$;

-- 3) Resumo executivo de benchmark
CREATE OR REPLACE FUNCTION public.get_market_benchmark_summary()
RETURNS TABLE (
  total_matched integer,
  below_market integer,
  competitive integer,
  above_market integer,
  avg_competitiveness_pct numeric,
  total_gap_amount numeric,
  critical_alerts integer
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_company uuid;
BEGIN
  v_company := get_user_company_id();

  IF v_company IS NULL OR NOT has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]) THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT * FROM get_market_competitiveness()
  )
  SELECT
    COUNT(*)::integer,
    COUNT(*) FILTER (WHERE market_position = 'below_market')::integer,
    COUNT(*) FILTER (WHERE market_position IN ('competitive_low','competitive_high'))::integer,
    COUNT(*) FILTER (WHERE market_position = 'above_market')::integer,
    ROUND(AVG(competitiveness_pct)::numeric, 2),
    COALESCE(SUM(GREATEST(market_median - internal_salary, 0)), 0)::numeric,
    COUNT(*) FILTER (
      WHERE internal_salary < market_median
        AND ((market_median - internal_salary) / NULLIF(market_median, 0)) * 100 >= 25
    )::integer
  FROM base;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_market_competitiveness() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_market_alerts(numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_market_benchmark_summary() TO authenticated;