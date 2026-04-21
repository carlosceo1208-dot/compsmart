CREATE OR REPLACE VIEW public.v_budget_merit_projection AS
SELECT
  v.employee_id,
  v.full_name,
  v.job_title,
  v.grade,
  v.unit_id,
  v.root_company_id,
  v.salary AS current_salary,
  v.last_performance_score,
  v.salary_range_percentage,
  v.range_min,
  v.range_max,
  v.range_median,
  CASE
    WHEN v.last_performance_score IS NULL THEN 0
    WHEN v.last_performance_score >= 4.5 AND v.salary_range_percentage < 30 THEN 12
    WHEN v.last_performance_score >= 4.5 AND v.salary_range_percentage < 60 THEN 8
    WHEN v.last_performance_score >= 4.0 AND v.salary_range_percentage < 30 THEN 9
    WHEN v.last_performance_score >= 4.0 AND v.salary_range_percentage < 60 THEN 6
    WHEN v.last_performance_score >= 3.0 AND v.salary_range_percentage < 50 THEN 4
    WHEN v.last_performance_score >= 3.0 THEN 2
    ELSE 0
  END::numeric AS suggested_merit_pct,
  CASE
    WHEN v.last_performance_score IS NULL THEN 0
    WHEN v.last_performance_score >= 4.5 AND v.salary_range_percentage < 30 THEN v.salary * 0.12
    WHEN v.last_performance_score >= 4.5 AND v.salary_range_percentage < 60 THEN v.salary * 0.08
    WHEN v.last_performance_score >= 4.0 AND v.salary_range_percentage < 30 THEN v.salary * 0.09
    WHEN v.last_performance_score >= 4.0 AND v.salary_range_percentage < 60 THEN v.salary * 0.06
    WHEN v.last_performance_score >= 3.0 AND v.salary_range_percentage < 50 THEN v.salary * 0.04
    WHEN v.last_performance_score >= 3.0 THEN v.salary * 0.02
    ELSE 0
  END::numeric AS suggested_monthly_impact
FROM public.v_employee_compensation_intelligence v
WHERE v.salary IS NOT NULL;

COMMENT ON VIEW public.v_budget_merit_projection IS
'Projeção de mérito sugerido por colaborador integrando performance + posição salarial. Usada pelo módulo de Orçamento Inteligente (Fase 2.7.1).';

CREATE OR REPLACE FUNCTION public.simulate_budget_scenarios(
  p_unit_id uuid DEFAULT NULL,
  p_fiscal_year integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer + 1
)
RETURNS TABLE(
  scenario text,
  multiplier numeric,
  total_employees bigint,
  total_current_payroll numeric,
  total_merit_impact_monthly numeric,
  total_merit_impact_annual numeric,
  avg_merit_pct numeric,
  payroll_increase_pct numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company UUID;
BEGIN
  IF NOT has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]) THEN
    RAISE EXCEPTION 'Acesso negado: somente Admin ou RH';
  END IF;

  v_company := get_user_company_id();

  RETURN QUERY
  WITH base AS (
    SELECT
      v.employee_id,
      v.current_salary,
      v.suggested_merit_pct,
      v.suggested_monthly_impact
    FROM public.v_budget_merit_projection v
    WHERE v.root_company_id = v_company
      AND (p_unit_id IS NULL OR v.unit_id = p_unit_id)
  ),
  totals AS (
    SELECT
      COUNT(*)::bigint AS emp_count,
      COALESCE(SUM(current_salary), 0)::numeric AS payroll,
      COALESCE(SUM(suggested_monthly_impact), 0)::numeric AS impact_monthly,
      COALESCE(AVG(NULLIF(suggested_merit_pct, 0)), 0)::numeric AS avg_pct
    FROM base
  ),
  scenarios(name, mult) AS (
    VALUES
      ('conservador'::text, 0.6::numeric),
      ('realista'::text, 1.0::numeric),
      ('agressivo'::text, 1.4::numeric)
  )
  SELECT
    s.name,
    s.mult,
    t.emp_count,
    t.payroll,
    ROUND(t.impact_monthly * s.mult, 2),
    ROUND(t.impact_monthly * s.mult * 12, 2),
    ROUND(t.avg_pct * s.mult, 2),
    CASE WHEN t.payroll > 0
      THEN ROUND((t.impact_monthly * s.mult / t.payroll) * 100, 2)
      ELSE 0
    END
  FROM scenarios s, totals t
  ORDER BY s.mult;
END;
$$;

COMMENT ON FUNCTION public.simulate_budget_scenarios IS
'Simula 3 cenários (conservador 60%, realista 100%, agressivo 140%) de impacto do mérito sugerido sobre a folha.';

CREATE OR REPLACE FUNCTION public.check_budget_ceiling(
  p_unit_id uuid DEFAULT NULL,
  p_fiscal_year integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer + 1,
  p_ceiling_pct numeric DEFAULT 5.0
)
RETURNS TABLE(
  scenario text,
  payroll_increase_pct numeric,
  ceiling_pct numeric,
  status text,
  excess_annual numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company UUID;
BEGIN
  IF NOT has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]) THEN
    RAISE EXCEPTION 'Acesso negado: somente Admin ou RH';
  END IF;

  v_company := get_user_company_id();

  RETURN QUERY
  SELECT
    s.scenario,
    s.payroll_increase_pct,
    p_ceiling_pct,
    CASE
      WHEN s.payroll_increase_pct <= p_ceiling_pct THEN 'dentro'
      WHEN s.payroll_increase_pct <= p_ceiling_pct * 1.2 THEN 'atenção'
      ELSE 'estouro'
    END,
    CASE
      WHEN s.payroll_increase_pct > p_ceiling_pct
      THEN ROUND(((s.payroll_increase_pct - p_ceiling_pct) / 100) * s.total_current_payroll * 12, 2)
      ELSE 0
    END
  FROM public.simulate_budget_scenarios(p_unit_id, p_fiscal_year) s;
END;
$$;

COMMENT ON FUNCTION public.check_budget_ceiling IS
'Compara cenários de mérito vs teto orçamentário (% configurável). Retorna status: dentro / atenção / estouro.';