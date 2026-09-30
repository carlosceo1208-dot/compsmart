CREATE OR REPLACE FUNCTION public.rh_admin_da_empresa(_company uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT COALESCE(public.is_super_admin(auth.uid()), false)
    OR COALESCE((_company IS NOT NULL AND _company = public.get_user_company_id()
        AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role])), false);
$$;

CREATE OR REPLACE FUNCTION public.calculate_transportation_benefit(p_employee_id uuid, p_monthly_cost numeric)
 RETURNS TABLE(employee_discount numeric, company_subsidy numeric, total_cost numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_salary NUMERIC;
  v_max_discount NUMERIC;
BEGIN
  IF NOT COALESCE((
    (SELECT root_company_id FROM profiles WHERE id = p_employee_id) = public.get_user_company_id()
    AND (p_employee_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'hr_manager'::app_role]))
  ), false) AND NOT COALESCE(public.is_super_admin(auth.uid()), false) THEN RAISE EXCEPTION 'Acesso negado' USING ERRCODE='42501'; END IF;
  SELECT salary INTO v_salary
  FROM profiles
  WHERE id = p_employee_id;
  v_max_discount := v_salary * 0.06;
  IF p_monthly_cost <= v_max_discount THEN
    RETURN QUERY SELECT p_monthly_cost, 0::NUMERIC, p_monthly_cost;
  ELSE
    RETURN QUERY SELECT v_max_discount, p_monthly_cost - v_max_discount, p_monthly_cost;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_employee_eligibility(p_employee_id uuid, p_benefit_id uuid)
 RETURNS TABLE(rule_id uuid, is_eligible boolean, company_value numeric, employee_contribution_type text, employee_contribution_value numeric, description text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_employee_grade TEXT;
  v_employee_salary NUMERIC;
  v_eligibility_type TEXT;
BEGIN
  IF NOT public.rh_admin_da_empresa((SELECT root_company_id FROM profiles WHERE id = p_employee_id)) THEN RAISE EXCEPTION 'Acesso negado' USING ERRCODE='42501'; END IF;
  IF (SELECT root_company_id FROM benefits WHERE id = p_benefit_id) IS DISTINCT FROM (SELECT root_company_id FROM profiles WHERE id = p_employee_id) THEN RAISE EXCEPTION 'Acesso negado' USING ERRCODE='42501'; END IF;
  SELECT grade, salary 
  INTO v_employee_grade, v_employee_salary
  FROM profiles
  WHERE id = p_employee_id;
  SELECT eligibility_type
  INTO v_eligibility_type
  FROM benefits
  WHERE id = p_benefit_id;
  IF v_eligibility_type = 'none' THEN
    RETURN QUERY
    SELECT NULL::UUID, TRUE, b.value_per_employee, b.default_employee_contribution_type, b.default_employee_contribution_value, 'Sem restrição de elegibilidade'::TEXT
    FROM benefits b WHERE b.id = p_benefit_id;
    RETURN;
  END IF;
  IF v_eligibility_type = 'grade' THEN
    RETURN QUERY
    SELECT ber.id, TRUE, ber.company_contribution_value, ber.employee_contribution_type, ber.employee_contribution_value, ber.description
    FROM benefit_eligibility_rules ber
    WHERE ber.benefit_id = p_benefit_id AND ber.is_active = TRUE
      AND v_employee_grade BETWEEN ber.grade_min AND ber.grade_max
    LIMIT 1;
  END IF;
  IF v_eligibility_type = 'salary_range' THEN
    RETURN QUERY
    SELECT ber.id, TRUE, ber.company_contribution_value, ber.employee_contribution_type, ber.employee_contribution_value, ber.description
    FROM benefit_eligibility_rules ber
    WHERE ber.benefit_id = p_benefit_id AND ber.is_active = TRUE
      AND v_employee_salary BETWEEN ber.salary_min AND ber.salary_max
    LIMIT 1;
  END IF;
  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.compare_scenarios(p_scenario_ids uuid[])
 RETURNS TABLE(scenario_id uuid, scenario_name text, strategy text, multiplier numeric, total_headcount integer, total_annual_impact numeric, high_performers_retained integer, low_performers_included integer, payroll_increase_pct numeric, avg_merit_pct numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF EXISTS (SELECT 1 FROM public.decision_scenarios s WHERE s.id = ANY(p_scenario_ids) AND NOT public.rh_admin_da_empresa(s.root_company_id)) THEN RAISE EXCEPTION 'Acesso negado' USING ERRCODE='42501'; END IF;
  IF NOT public.rh_admin_da_empresa(public.get_user_company_id()) THEN RAISE EXCEPTION 'Acesso negado' USING ERRCODE='42501'; END IF;
  RETURN QUERY
  SELECT s.id, s.scenario_name, s.strategy, s.multiplier, s.total_headcount, s.total_annual_impact,
    s.high_performers_retained, s.low_performers_included, s.payroll_increase_pct,
    ROUND(AVG(i.scenario_merit_pct)::NUMERIC, 2)
  FROM public.decision_scenarios s
  LEFT JOIN public.decision_scenario_items i ON i.scenario_id = s.id
  WHERE s.id = ANY(p_scenario_ids)
  GROUP BY s.id, s.scenario_name, s.strategy, s.multiplier, s.total_headcount,
           s.total_annual_impact, s.high_performers_retained, s.low_performers_included, s.payroll_increase_pct
  ORDER BY s.total_annual_impact ASC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_unit_budget_status(p_root_company_id uuid, p_fiscal_year integer DEFAULT (EXTRACT(year FROM CURRENT_DATE))::integer)
 RETURNS TABLE(unit_id uuid, unit_name text, fiscal_year integer, approved_amount_annual numeric, reserved_amount numeric, consumed_amount numeric, available_amount numeric, burn_pct numeric, status text, ledger_count bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.rh_admin_da_empresa(p_root_company_id) THEN RAISE EXCEPTION 'Acesso negado' USING ERRCODE='42501'; END IF;
  RETURN QUERY
  SELECT
    b.unit_id,
    o.name AS unit_name,
    b.fiscal_year,
    b.approved_amount_annual,
    COALESCE(SUM(l.amount_annual) FILTER (WHERE l.movement_type = 'reserve'), 0) AS reserved_amount,
    COALESCE(SUM(l.amount_annual) FILTER (WHERE l.movement_type = 'debit'), 0)
      - COALESCE(SUM(l.amount_annual) FILTER (WHERE l.movement_type = 'revert'), 0) AS consumed_amount,
    b.approved_amount_annual
      - COALESCE(SUM(l.amount_annual) FILTER (WHERE l.movement_type IN ('debit','reserve')), 0)
      + COALESCE(SUM(l.amount_annual) FILTER (WHERE l.movement_type = 'revert'), 0) AS available_amount,
    CASE WHEN b.approved_amount_annual > 0 THEN
      ROUND((
        (COALESCE(SUM(l.amount_annual) FILTER (WHERE l.movement_type IN ('debit','reserve')), 0)
         - COALESCE(SUM(l.amount_annual) FILTER (WHERE l.movement_type = 'revert'), 0))
        / b.approved_amount_annual
      ) * 100, 2)
    ELSE 0 END AS burn_pct,
    CASE
      WHEN b.approved_amount_annual = 0 THEN 'no_budget'
      WHEN COALESCE(SUM(l.amount_annual) FILTER (WHERE l.movement_type IN ('debit','reserve')), 0)
           - COALESCE(SUM(l.amount_annual) FILTER (WHERE l.movement_type = 'revert'), 0)
           >= b.approved_amount_annual THEN 'exhausted'
      WHEN (COALESCE(SUM(l.amount_annual) FILTER (WHERE l.movement_type IN ('debit','reserve')), 0)
            - COALESCE(SUM(l.amount_annual) FILTER (WHERE l.movement_type = 'revert'), 0))
           / b.approved_amount_annual >= 0.95 THEN 'critical'
      WHEN (COALESCE(SUM(l.amount_annual) FILTER (WHERE l.movement_type IN ('debit','reserve')), 0)
            - COALESCE(SUM(l.amount_annual) FILTER (WHERE l.movement_type = 'revert'), 0))
           / b.approved_amount_annual >= 0.80 THEN 'warning'
      ELSE 'healthy'
    END AS status,
    COUNT(l.id) AS ledger_count
  FROM public.unit_merit_budgets b
  JOIN public.organizational_structure o ON o.id = b.unit_id
  LEFT JOIN public.merit_budget_ledger l ON l.budget_id = b.id
  WHERE b.root_company_id = p_root_company_id
    AND b.fiscal_year = p_fiscal_year
  GROUP BY b.id, b.unit_id, o.name, b.fiscal_year, b.approved_amount_annual
  ORDER BY o.name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.simulate_9box_budget(p_root_company_id uuid, p_fiscal_year integer DEFAULT (EXTRACT(year FROM now()))::integer, p_ceiling_pct numeric DEFAULT 5.0)
 RETURNS TABLE(unit_id uuid, unit_name text, headcount integer, current_payroll_annual numeric, proposed_merit_impact_annual numeric, payroll_increase_pct numeric, ceiling_pct numeric, ceiling_amount_annual numeric, excess_annual numeric, status text, avg_box_position numeric, high_performers integer, low_performers integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.rh_admin_da_empresa(p_root_company_id) THEN RAISE EXCEPTION 'Acesso negado' USING ERRCODE='42501'; END IF;
  RETURN QUERY
  WITH active_recs AS (
    SELECT
      p.unit_id,
      r.employee_id,
      r.box_position,
      COALESCE(r.current_salary, 0) AS current_salary,
      COALESCE(r.financial_impact_annual, 0) AS impact_annual
    FROM public.talent_intelligence_recommendations r
    JOIN public.profiles p ON p.id = r.employee_id
    WHERE r.root_company_id = p_root_company_id
      AND r.status IN ('draft','submitted','pending','approved')
  )
  SELECT
    o.id AS unit_id,
    o.name AS unit_name,
    COUNT(ar.employee_id)::INTEGER AS headcount,
    ROUND(SUM(ar.current_salary) * 12, 2) AS current_payroll_annual,
    ROUND(SUM(ar.impact_annual), 2) AS proposed_merit_impact_annual,
    CASE WHEN SUM(ar.current_salary) > 0
      THEN ROUND((SUM(ar.impact_annual) / (SUM(ar.current_salary) * 12)) * 100, 2)
      ELSE 0 END AS payroll_increase_pct,
    p_ceiling_pct AS ceiling_pct,
    ROUND(SUM(ar.current_salary) * 12 * (p_ceiling_pct / 100.0), 2) AS ceiling_amount_annual,
    GREATEST(
      ROUND(SUM(ar.impact_annual) - (SUM(ar.current_salary) * 12 * (p_ceiling_pct / 100.0)), 2),
      0
    ) AS excess_annual,
    CASE
      WHEN SUM(ar.current_salary) = 0 THEN 'sem dados'
      WHEN SUM(ar.impact_annual) > SUM(ar.current_salary) * 12 * (p_ceiling_pct / 100.0)
        THEN 'estouro'
      WHEN SUM(ar.impact_annual) > SUM(ar.current_salary) * 12 * (p_ceiling_pct / 100.0) * 0.85
        THEN 'atenção'
      ELSE 'dentro'
    END AS status,
    ROUND(AVG(ar.box_position)::NUMERIC, 2) AS avg_box_position,
    COUNT(*) FILTER (WHERE ar.box_position >= 7)::INTEGER AS high_performers,
    COUNT(*) FILTER (WHERE ar.box_position <= 3)::INTEGER AS low_performers
  FROM public.organizational_structure o
  LEFT JOIN active_recs ar ON ar.unit_id = o.id
  WHERE o.root_company_id = p_root_company_id OR o.id = p_root_company_id
  GROUP BY o.id, o.name
  HAVING COUNT(ar.employee_id) > 0
  ORDER BY proposed_merit_impact_annual DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_budget_capacity(p_unit_id uuid, p_fiscal_year integer, p_amount_annual numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_budget RECORD;
  v_consumed NUMERIC;
  v_available NUMERIC;
  v_burn_pct NUMERIC;
BEGIN
  IF NOT public.rh_admin_da_empresa((SELECT COALESCE(root_company_id, id) FROM public.organizational_structure WHERE id = p_unit_id)) THEN RAISE EXCEPTION 'Acesso negado' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_budget FROM public.unit_merit_budgets
  WHERE unit_id = p_unit_id AND fiscal_year = p_fiscal_year;
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'has_budget', false,
      'can_apply', false,
      'reason', 'Nenhum orçamento de mérito aprovado para esta unidade no ano fiscal ' || p_fiscal_year
    );
  END IF;
  SELECT
    COALESCE(SUM(amount_annual) FILTER (WHERE movement_type IN ('debit','reserve')), 0)
    - COALESCE(SUM(amount_annual) FILTER (WHERE movement_type = 'revert'), 0)
  INTO v_consumed
  FROM public.merit_budget_ledger WHERE budget_id = v_budget.id;
  v_available := v_budget.approved_amount_annual - v_consumed;
  v_burn_pct := CASE WHEN v_budget.approved_amount_annual > 0
    THEN ((v_consumed + p_amount_annual) / v_budget.approved_amount_annual) * 100
    ELSE 0 END;
  RETURN jsonb_build_object(
    'has_budget', true,
    'can_apply', p_amount_annual <= v_available,
    'approved_amount', v_budget.approved_amount_annual,
    'consumed_amount', v_consumed,
    'available_amount', v_available,
    'requested_amount', p_amount_annual,
    'projected_burn_pct', ROUND(v_burn_pct, 2),
    'reason', CASE
      WHEN p_amount_annual > v_available
        THEN 'Valor solicitado (R$ ' || ROUND(p_amount_annual,2) || ') excede orçamento disponível (R$ ' || ROUND(v_available,2) || ')'
      WHEN v_burn_pct >= 95
        THEN 'Aprovação levará consumo a ' || ROUND(v_burn_pct,1) || '% — requer override do CFO'
      ELSE 'Capacidade disponível'
    END
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.apply_merit_to_budget(p_unit_id uuid, p_fiscal_year integer, p_amount_annual numeric, p_source_type text, p_source_id uuid, p_employee_id uuid DEFAULT NULL::uuid, p_notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_budget_id UUID;
  v_balance NUMERIC;
  v_ledger_id UUID;
BEGIN
  IF auth.uid() IS NOT NULL AND pg_trigger_depth() = 0 THEN
    IF NOT public.rh_admin_da_empresa((SELECT COALESCE(root_company_id, id) FROM public.organizational_structure WHERE id = p_unit_id)) THEN RAISE EXCEPTION 'Acesso negado' USING ERRCODE='42501'; END IF;
  END IF;
  SELECT id INTO v_budget_id FROM public.unit_merit_budgets
  WHERE unit_id = p_unit_id AND fiscal_year = p_fiscal_year;
  IF v_budget_id IS NULL THEN
    INSERT INTO public.unit_merit_budgets(root_company_id, unit_id, fiscal_year, approved_amount_annual, notes, approved_by)
    SELECT root_company_id, id, p_fiscal_year, 0, 'Auto-criado por aplicação sem orçamento prévio', auth.uid()
    FROM public.organizational_structure WHERE id = p_unit_id
    RETURNING id INTO v_budget_id;
  END IF;
  SELECT (approved_amount_annual
    - COALESCE((SELECT SUM(amount_annual) FROM public.merit_budget_ledger
                WHERE budget_id = v_budget_id AND movement_type IN ('debit','reserve')), 0)
    + COALESCE((SELECT SUM(amount_annual) FROM public.merit_budget_ledger
                WHERE budget_id = v_budget_id AND movement_type = 'revert'), 0)
    - p_amount_annual)
  INTO v_balance
  FROM public.unit_merit_budgets WHERE id = v_budget_id;
  INSERT INTO public.merit_budget_ledger(
    budget_id, unit_id, fiscal_year, source_type, source_id, employee_id,
    movement_type, amount_annual, balance_after, notes, created_by
  ) VALUES (
    v_budget_id, p_unit_id, p_fiscal_year, p_source_type, p_source_id, p_employee_id,
    'debit', p_amount_annual, v_balance, p_notes, auth.uid()
  ) RETURNING id INTO v_ledger_id;
  RETURN v_ledger_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.rh_admin_da_empresa(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rh_admin_da_empresa(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.calculate_transportation_benefit(uuid,numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.calculate_transportation_benefit(uuid,numeric) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.check_employee_eligibility(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_employee_eligibility(uuid,uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.compare_scenarios(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.compare_scenarios(uuid[]) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.get_unit_budget_status(uuid,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_unit_budget_status(uuid,integer) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.simulate_9box_budget(uuid,integer,numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.simulate_9box_budget(uuid,integer,numeric) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.check_budget_capacity(uuid,integer,numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_budget_capacity(uuid,integer,numeric) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.apply_merit_to_budget(uuid,integer,numeric,text,uuid,uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_merit_to_budget(uuid,integer,numeric,text,uuid,uuid,text) TO authenticated, service_role;