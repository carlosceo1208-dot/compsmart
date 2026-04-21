-- ============================================
-- FASE 2.7.2 — EQUIDADE & PAY GAP
-- ============================================

-- 1) Pay Gap por Gênero
CREATE OR REPLACE FUNCTION public.get_pay_gap_by_gender()
RETURNS TABLE(
  gender TEXT,
  employee_count BIGINT,
  avg_salary NUMERIC,
  median_salary NUMERIC,
  gap_vs_male_percentage NUMERIC
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company UUID;
  v_male_avg NUMERIC;
BEGIN
  IF NOT has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]) THEN
    RAISE EXCEPTION 'Acesso negado: somente Admin ou RH';
  END IF;

  v_company := get_user_company_id();

  SELECT AVG(p.salary) INTO v_male_avg
  FROM profiles p
  WHERE p.root_company_id = v_company
    AND p.salary IS NOT NULL
    AND LOWER(COALESCE(p.gender, '')) IN ('male', 'masculino', 'm');

  RETURN QUERY
  SELECT
    COALESCE(NULLIF(TRIM(p.gender), ''), 'Não informado')::TEXT AS gender,
    COUNT(*)::BIGINT AS employee_count,
    ROUND(AVG(p.salary), 2) AS avg_salary,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY p.salary)::NUMERIC, 2) AS median_salary,
    CASE
      WHEN v_male_avg IS NULL OR v_male_avg = 0 THEN NULL
      ELSE ROUND(((AVG(p.salary) - v_male_avg) / v_male_avg) * 100, 2)
    END AS gap_vs_male_percentage
  FROM profiles p
  WHERE p.root_company_id = v_company
    AND p.salary IS NOT NULL
  GROUP BY COALESCE(NULLIF(TRIM(p.gender), ''), 'Não informado')
  ORDER BY employee_count DESC;
END;
$$;

-- 2) Pay Gap por Grade (dispersão interna)
CREATE OR REPLACE FUNCTION public.get_pay_gap_by_grade()
RETURNS TABLE(
  grade TEXT,
  employee_count BIGINT,
  min_salary NUMERIC,
  avg_salary NUMERIC,
  max_salary NUMERIC,
  std_deviation NUMERIC,
  coefficient_variation NUMERIC
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
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
    p.grade::TEXT,
    COUNT(*)::BIGINT,
    ROUND(MIN(p.salary), 2),
    ROUND(AVG(p.salary), 2),
    ROUND(MAX(p.salary), 2),
    ROUND(COALESCE(STDDEV(p.salary), 0), 2),
    CASE
      WHEN AVG(p.salary) > 0
        THEN ROUND((COALESCE(STDDEV(p.salary), 0) / AVG(p.salary)) * 100, 2)
      ELSE 0
    END
  FROM profiles p
  WHERE p.root_company_id = v_company
    AND p.salary IS NOT NULL
    AND p.grade IS NOT NULL
  GROUP BY p.grade
  HAVING COUNT(*) >= 2
  ORDER BY p.grade;
END;
$$;

-- 3) Índice de Gini salarial
CREATE OR REPLACE FUNCTION public.get_salary_gini_index()
RETURNS TABLE(
  gini_index NUMERIC,
  total_employees BIGINT,
  total_payroll NUMERIC,
  interpretation TEXT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company UUID;
  v_n BIGINT;
  v_sum NUMERIC;
  v_gini NUMERIC;
  v_interpretation TEXT;
BEGIN
  IF NOT has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]) THEN
    RAISE EXCEPTION 'Acesso negado: somente Admin ou RH';
  END IF;

  v_company := get_user_company_id();

  WITH ordered AS (
    SELECT salary, ROW_NUMBER() OVER (ORDER BY salary) AS rk
    FROM profiles
    WHERE root_company_id = v_company AND salary IS NOT NULL AND salary > 0
  ),
  agg AS (
    SELECT COUNT(*) AS n, SUM(salary) AS total, SUM((2 * rk - COUNT(*) OVER () - 1) * salary) AS num
    FROM ordered
  )
  SELECT n, total,
    CASE WHEN n > 0 AND total > 0 THEN ROUND((num / (n * total))::NUMERIC, 4) ELSE 0 END
  INTO v_n, v_sum, v_gini
  FROM agg;

  v_interpretation := CASE
    WHEN v_gini IS NULL OR v_n = 0 THEN 'Dados insuficientes'
    WHEN v_gini < 0.25 THEN 'Distribuição muito equitativa'
    WHEN v_gini < 0.40 THEN 'Distribuição equilibrada'
    WHEN v_gini < 0.55 THEN 'Desigualdade moderada'
    ELSE 'Desigualdade alta — revisar política salarial'
  END;

  RETURN QUERY SELECT COALESCE(v_gini, 0), COALESCE(v_n, 0), COALESCE(v_sum, 0), v_interpretation;
END;
$$;

-- 4) Alertas de inequidade (mesmo cargo/grade, diferença > 15%)
CREATE OR REPLACE FUNCTION public.get_equity_alerts(p_threshold_pct NUMERIC DEFAULT 15)
RETURNS TABLE(
  job_title TEXT,
  grade TEXT,
  employee_count BIGINT,
  min_salary NUMERIC,
  max_salary NUMERIC,
  gap_percentage NUMERIC,
  severity TEXT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
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
    p.job_title::TEXT,
    p.grade::TEXT,
    COUNT(*)::BIGINT,
    ROUND(MIN(p.salary), 2),
    ROUND(MAX(p.salary), 2),
    ROUND(((MAX(p.salary) - MIN(p.salary)) / NULLIF(MIN(p.salary), 0)) * 100, 2),
    CASE
      WHEN ((MAX(p.salary) - MIN(p.salary)) / NULLIF(MIN(p.salary), 0)) * 100 > 40 THEN 'crítico'
      WHEN ((MAX(p.salary) - MIN(p.salary)) / NULLIF(MIN(p.salary), 0)) * 100 > 25 THEN 'alto'
      ELSE 'médio'
    END
  FROM profiles p
  WHERE p.root_company_id = v_company
    AND p.salary IS NOT NULL
    AND p.job_title IS NOT NULL
    AND p.grade IS NOT NULL
  GROUP BY p.job_title, p.grade
  HAVING COUNT(*) >= 2
    AND ((MAX(p.salary) - MIN(p.salary)) / NULLIF(MIN(p.salary), 0)) * 100 > p_threshold_pct
  ORDER BY ((MAX(p.salary) - MIN(p.salary)) / NULLIF(MIN(p.salary), 0)) DESC
  LIMIT 50;
END;
$$;

-- Permissões
REVOKE ALL ON FUNCTION public.get_pay_gap_by_gender() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_pay_gap_by_grade() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_salary_gini_index() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_equity_alerts(NUMERIC) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_pay_gap_by_gender() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pay_gap_by_grade() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_salary_gini_index() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_equity_alerts(NUMERIC) TO authenticated;