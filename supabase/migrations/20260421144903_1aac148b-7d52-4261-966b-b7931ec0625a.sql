
-- =====================================================
-- FASE 2.6: Inteligência Mérito × Performance (v3)
-- =====================================================

CREATE OR REPLACE VIEW public.v_employee_compensation_intelligence
WITH (security_invoker = true)
AS
SELECT
  p.id AS employee_id,
  p.full_name,
  p.email,
  p.root_company_id,
  p.unit_id,
  p.job_title,
  p.job_title_id,
  p.grade,
  p.salary,
  p.variable_salary,
  p.benefits_value,
  p.salary_range_percentage,
  p.manager_id,
  p.status,
  p.hire_date,
  (
    SELECT pe.final_score
    FROM performance_evaluations pe
    WHERE pe.employee_id = p.id
      AND pe.status = 'approved'
    ORDER BY pe.approved_at DESC NULLS LAST, pe.created_at DESC
    LIMIT 1
  ) AS last_performance_score,
  (
    SELECT pe.approved_at
    FROM performance_evaluations pe
    WHERE pe.employee_id = p.id
      AND pe.status = 'approved'
    ORDER BY pe.approved_at DESC NULLS LAST, pe.created_at DESC
    LIMIT 1
  ) AS last_evaluation_date,
  (
    SELECT pe.potential_score
    FROM performance_evaluations pe
    WHERE pe.employee_id = p.id
      AND pe.status = 'approved'
    ORDER BY pe.approved_at DESC NULLS LAST, pe.created_at DESC
    LIMIT 1
  ) AS last_potential_score,
  (
    SELECT ps.readiness::text
    FROM performance_succession ps
    WHERE ps.successor_employee_id = p.id
    ORDER BY ps.updated_at DESC NULLS LAST, ps.created_at DESC
    LIMIT 1
  ) AS succession_readiness,
  sr.min_value AS range_min,
  sr.median_value AS range_median,
  sr.max_value AS range_max
FROM public.profiles p
LEFT JOIN public.salary_tables st
  ON st.root_company_id = p.root_company_id
  AND st.is_active = true
LEFT JOIN public.salary_ranges sr
  ON sr.salary_table_id = st.id
  AND LPAD(TRIM(sr.grade), 3, '0') = LPAD(TRIM(p.grade), 3, '0')
WHERE p.status = 'active'
  AND p.employee_number IS NOT NULL;

COMMENT ON VIEW public.v_employee_compensation_intelligence IS
'Fase 2.6 — View integrada de remuneração + performance + faixas. Filtrada por RLS via profiles.';

-- Função de sugestão de mérito
CREATE OR REPLACE FUNCTION public.get_merit_suggestion(p_employee_id UUID)
RETURNS TABLE(
  employee_id UUID,
  current_salary NUMERIC,
  performance_score NUMERIC,
  range_position_percentage NUMERIC,
  suggested_merit_percentage NUMERIC,
  suggested_new_salary NUMERIC,
  monthly_impact NUMERIC,
  annual_impact NUMERIC,
  recommendation TEXT,
  is_mismatch BOOLEAN,
  mismatch_reason TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_company UUID;
  v_target_company UUID;
  v_caller_role_ok BOOLEAN;
  v_emp RECORD;
  v_merit NUMERIC := 0;
  v_recommendation TEXT;
  v_mismatch BOOLEAN := FALSE;
  v_mismatch_reason TEXT := NULL;
BEGIN
  SELECT root_company_id INTO v_caller_company
  FROM profiles WHERE id = auth.uid();

  SELECT root_company_id INTO v_target_company
  FROM profiles WHERE id = p_employee_id;

  IF v_caller_company IS NULL OR v_target_company IS NULL OR v_caller_company <> v_target_company THEN
    RAISE EXCEPTION 'Acesso negado: funcionário fora da sua empresa';
  END IF;

  v_caller_role_ok := has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role])
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = p_employee_id AND manager_id = auth.uid()
    );

  IF NOT v_caller_role_ok THEN
    RAISE EXCEPTION 'Acesso negado: somente Admin, RH ou gestor direto';
  END IF;

  SELECT * INTO v_emp
  FROM v_employee_compensation_intelligence
  WHERE v_employee_compensation_intelligence.employee_id = p_employee_id;

  IF v_emp IS NULL THEN
    RAISE EXCEPTION 'Funcionário não encontrado ou inativo';
  END IF;

  IF v_emp.last_performance_score IS NULL THEN
    v_merit := 0;
    v_recommendation := 'Sem avaliação aprovada — realize ciclo de performance antes de decidir mérito.';
  ELSIF v_emp.last_performance_score >= 4.5 THEN
    IF COALESCE(v_emp.salary_range_percentage, 50) < 30 THEN
      v_merit := 10;
      v_recommendation := 'Talento de alto desempenho com remuneração defasada. Mérito agressivo recomendado para retenção.';
      v_mismatch := TRUE;
      v_mismatch_reason := 'Alta performance (>=4.5) com salário no Q1 da faixa';
    ELSIF v_emp.salary_range_percentage < 70 THEN
      v_merit := 7;
      v_recommendation := 'Alto desempenho — mérito acima da média do mercado.';
    ELSE
      v_merit := 0;
      v_recommendation := 'Já no topo da faixa. Considere PROMOÇÃO ou ILP em vez de mérito.';
    END IF;
  ELSIF v_emp.last_performance_score >= 3.5 THEN
    IF COALESCE(v_emp.salary_range_percentage, 50) < 30 THEN
      v_merit := 6;
      v_recommendation := 'Bom desempenho com salário abaixo da mediana — ajuste recomendado.';
    ELSIF v_emp.salary_range_percentage < 70 THEN
      v_merit := 4;
      v_recommendation := 'Mérito padrão para bom desempenho.';
    ELSE
      v_merit := 2;
      v_recommendation := 'Bom desempenho mas próximo do teto da faixa — mérito conservador.';
    END IF;
  ELSIF v_emp.last_performance_score >= 2.5 THEN
    v_merit := 2.5;
    v_recommendation := 'Desempenho dentro do esperado — mérito moderado (acompanhamento INPC).';
  ELSE
    v_merit := 0;
    v_recommendation := 'Desempenho abaixo do esperado — sem mérito. PDI obrigatório.';
    IF COALESCE(v_emp.salary_range_percentage, 50) > 70 THEN
      v_mismatch := TRUE;
      v_mismatch_reason := 'Baixa performance com salário alto na faixa (Q3+)';
    END IF;
  END IF;

  RETURN QUERY SELECT
    p_employee_id,
    v_emp.salary,
    v_emp.last_performance_score,
    v_emp.salary_range_percentage,
    v_merit,
    ROUND(v_emp.salary * (1 + v_merit/100), 2),
    ROUND(v_emp.salary * (v_merit/100), 2),
    ROUND(v_emp.salary * (v_merit/100) * 12, 2),
    v_recommendation,
    v_mismatch,
    v_mismatch_reason;
END;
$$;

COMMENT ON FUNCTION public.get_merit_suggestion IS
'Fase 2.6 — Sugere percentual de mérito baseado em performance × posição na faixa salarial.';

-- KPI de incoerência
CREATE OR REPLACE FUNCTION public.get_compensation_mismatch_kpi()
RETURNS TABLE(
  total_employees BIGINT,
  high_perf_low_salary BIGINT,
  low_perf_high_salary BIGINT,
  total_mismatches BIGINT,
  mismatch_percentage NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
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
  WITH base AS (
    SELECT *
    FROM v_employee_compensation_intelligence
    WHERE root_company_id = v_company
  ),
  metrics AS (
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (
        WHERE last_performance_score >= 4.0
        AND salary_range_percentage < 30
      ) AS hp_ls,
      COUNT(*) FILTER (
        WHERE last_performance_score < 2.5
        AND salary_range_percentage > 70
      ) AS lp_hs
    FROM base
  )
  SELECT
    m.total,
    m.hp_ls,
    m.lp_hs,
    (m.hp_ls + m.lp_hs),
    CASE WHEN m.total > 0
      THEN ROUND(((m.hp_ls + m.lp_hs)::NUMERIC / m.total) * 100, 2)
      ELSE 0
    END
  FROM metrics m;
END;
$$;

COMMENT ON FUNCTION public.get_compensation_mismatch_kpi IS
'Fase 2.6 — KPI de coerência entre performance e remuneração.';

-- Top mismatches
CREATE OR REPLACE FUNCTION public.get_top_compensation_mismatches(p_limit INTEGER DEFAULT 5)
RETURNS TABLE(
  employee_id UUID,
  full_name TEXT,
  job_title TEXT,
  performance_score NUMERIC,
  salary_range_percentage NUMERIC,
  mismatch_severity TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company UUID;
BEGIN
  IF NOT has_any_role(auth.uid(), ARRAY['admin'::app_role, 'hr_manager'::app_role]) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  v_company := get_user_company_id();

  RETURN QUERY
  SELECT
    v.employee_id,
    v.full_name,
    v.job_title,
    v.last_performance_score,
    v.salary_range_percentage,
    CASE
      WHEN v.last_performance_score >= 4.5 AND v.salary_range_percentage < 20 THEN 'crítico'
      WHEN v.last_performance_score >= 4.0 AND v.salary_range_percentage < 30 THEN 'alto'
      WHEN v.last_performance_score < 2.0 AND v.salary_range_percentage > 80 THEN 'crítico'
      WHEN v.last_performance_score < 2.5 AND v.salary_range_percentage > 70 THEN 'alto'
      ELSE 'médio'
    END AS severity
  FROM v_employee_compensation_intelligence v
  WHERE v.root_company_id = v_company
    AND (
      (v.last_performance_score >= 4.0 AND v.salary_range_percentage < 30)
      OR (v.last_performance_score < 2.5 AND v.salary_range_percentage > 70)
    )
  ORDER BY
    CASE
      WHEN v.last_performance_score >= 4.5 AND v.salary_range_percentage < 20 THEN 1
      WHEN v.last_performance_score < 2.0 AND v.salary_range_percentage > 80 THEN 2
      ELSE 3
    END,
    v.last_performance_score DESC NULLS LAST
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.get_top_compensation_mismatches IS
'Fase 2.6 — Lista funcionários com maior incoerência entre desempenho e remuneração.';
