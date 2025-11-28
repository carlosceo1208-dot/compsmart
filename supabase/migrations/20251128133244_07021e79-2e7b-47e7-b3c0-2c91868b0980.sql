-- Fix functions without explicit search_path to prevent search_path injection attacks

-- Fix calculate_salary_range
CREATE OR REPLACE FUNCTION public.calculate_salary_range(p_median numeric, p_amplitude numeric)
 RETURNS TABLE(min_value numeric, q1_value numeric, median_value numeric, q3_value numeric, max_value numeric)
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path = public
AS $function$
DECLARE
  v_spread NUMERIC;
  v_range NUMERIC;
BEGIN
  v_spread := p_amplitude / 2;
  min_value := p_median * (1 - v_spread/100);
  max_value := p_median * (1 + v_spread/100);
  median_value := p_median;
  v_range := max_value - min_value;
  q1_value := min_value + (v_range * 0.25);
  q3_value := min_value + (v_range * 0.75);
  RETURN NEXT;
END;
$function$;

-- Fix update_support_conversations_updated_at
CREATE OR REPLACE FUNCTION public.update_support_conversations_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix suggest_next_employee_number
CREATE OR REPLACE FUNCTION public.suggest_next_employee_number()
 RETURNS character varying
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  v_year TEXT;
  v_max_seq INTEGER;
BEGIN
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(
    CASE 
      WHEN employee_number ~ ('^' || v_year || '\d{3,}$')
      THEN SUBSTRING(employee_number FROM LENGTH(v_year) + 1)::INTEGER
      ELSE 0
    END
  ), 0)
  INTO v_max_seq
  FROM public.profiles
  WHERE employee_number LIKE (v_year || '%');
  
  RETURN v_year || LPAD((v_max_seq + 1)::TEXT, 3, '0');
END;
$function$;

-- Fix calculate_salary_range_fixed
CREATE OR REPLACE FUNCTION public.calculate_salary_range_fixed(p_median numeric)
 RETURNS TABLE(min_value numeric, q1_value numeric, median_value numeric, q3_value numeric, max_value numeric)
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path = public
AS $function$
DECLARE
  v_range numeric;
BEGIN
  min_value := p_median * 0.80;
  max_value := p_median * 1.25;
  median_value := p_median;
  v_range := max_value - min_value;
  q1_value := min_value + (v_range * 0.25);
  q3_value := min_value + (v_range * 0.75);
  RETURN NEXT;
END;
$function$;

-- Fix check_employee_eligibility
CREATE OR REPLACE FUNCTION public.check_employee_eligibility(p_employee_id uuid, p_benefit_id uuid)
 RETURNS TABLE(rule_id uuid, is_eligible boolean, company_value numeric, employee_contribution_type text, employee_contribution_value numeric, description text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_employee_grade TEXT;
  v_employee_salary NUMERIC;
  v_eligibility_type TEXT;
BEGIN
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
    SELECT 
      NULL::UUID,
      TRUE,
      b.value_per_employee,
      b.default_employee_contribution_type,
      b.default_employee_contribution_value,
      'Sem restrição de elegibilidade'::TEXT
    FROM benefits b
    WHERE b.id = p_benefit_id;
    RETURN;
  END IF;
  
  IF v_eligibility_type = 'grade' THEN
    RETURN QUERY
    SELECT 
      ber.id,
      TRUE,
      ber.company_contribution_value,
      ber.employee_contribution_type,
      ber.employee_contribution_value,
      ber.description
    FROM benefit_eligibility_rules ber
    WHERE ber.benefit_id = p_benefit_id
      AND ber.is_active = TRUE
      AND v_employee_grade BETWEEN ber.grade_min AND ber.grade_max
    LIMIT 1;
  END IF;
  
  IF v_eligibility_type = 'salary_range' THEN
    RETURN QUERY
    SELECT 
      ber.id,
      TRUE,
      ber.company_contribution_value,
      ber.employee_contribution_type,
      ber.employee_contribution_value,
      ber.description
    FROM benefit_eligibility_rules ber
    WHERE ber.benefit_id = p_benefit_id
      AND ber.is_active = TRUE
      AND v_employee_salary BETWEEN ber.salary_min AND ber.salary_max
    LIMIT 1;
  END IF;
  
  RETURN;
END;
$function$;

-- Fix calculate_transportation_benefit
CREATE OR REPLACE FUNCTION public.calculate_transportation_benefit(p_employee_id uuid, p_monthly_cost numeric)
 RETURNS TABLE(employee_discount numeric, company_subsidy numeric, total_cost numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_salary NUMERIC;
  v_max_discount NUMERIC;
BEGIN
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

-- Fix calculate_employee_benefits
CREATE OR REPLACE FUNCTION public.calculate_employee_benefits(p_employee_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_total NUMERIC := 0;
BEGIN
  SELECT COALESCE(SUM(company_contribution_value), 0)
  INTO v_total
  FROM public.employee_benefits
  WHERE employee_id = p_employee_id
    AND is_active = true
    AND (end_date IS NULL OR end_date >= CURRENT_DATE);
  
  UPDATE public.profiles
  SET benefits_value = v_total
  WHERE id = p_employee_id;
  
  RETURN v_total;
END;
$function$;

-- Fix recalculate_benefits_after_change
CREATE OR REPLACE FUNCTION public.recalculate_benefits_after_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM calculate_employee_benefits(OLD.employee_id);
  ELSE
    PERFORM calculate_employee_benefits(NEW.employee_id);
  END IF;
  RETURN NULL;
END;
$function$;

-- Fix create_default_alert_configs
CREATE OR REPLACE FUNCTION public.create_default_alert_configs()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  IF NEW.type = 'company' THEN
    INSERT INTO alert_configurations (root_company_id, alert_type, threshold_value, threshold_unit, recipients)
    VALUES 
      (NEW.id, 'spike_queries', 150, 'percentage', ARRAY['admin@company.com']),
      (NEW.id, 'recurring_errors', 5, 'absolute', ARRAY['admin@company.com']),
      (NEW.id, 'inactive_users', 30, 'days', ARRAY['admin@company.com']),
      (NEW.id, 'token_overconsumption', 80, 'percentage', ARRAY['admin@company.com']),
      (NEW.id, 'after_hours_usage', 10, 'absolute', ARRAY['admin@company.com']),
      (NEW.id, 'user_concentration', 50, 'percentage', ARRAY['admin@company.com']);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix detect_query_spikes
CREATE OR REPLACE FUNCTION public.detect_query_spikes(p_company_id uuid, p_threshold numeric)
 RETURNS TABLE(detected boolean, current_count bigint, avg_last_7_days numeric, percentage_increase numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_today_count BIGINT;
  v_avg_count NUMERIC;
BEGIN
  SELECT COUNT(*) INTO v_today_count
  FROM v_agent_conversations
  WHERE root_company_id = p_company_id
    AND created_at >= CURRENT_DATE
    AND created_at < CURRENT_DATE + INTERVAL '1 day';
  
  SELECT AVG(daily_count) INTO v_avg_count
  FROM (
    SELECT DATE(created_at) as day, COUNT(*) as daily_count
    FROM v_agent_conversations
    WHERE root_company_id = p_company_id
      AND created_at >= CURRENT_DATE - INTERVAL '7 days'
      AND created_at < CURRENT_DATE
    GROUP BY DATE(created_at)
  ) daily_stats;
  
  v_avg_count := COALESCE(v_avg_count, 0);
  
  RETURN QUERY SELECT 
    (v_today_count > (v_avg_count * (p_threshold / 100)))::BOOLEAN,
    v_today_count,
    v_avg_count,
    CASE WHEN v_avg_count > 0 
      THEN ((v_today_count - v_avg_count) / v_avg_count * 100)
      ELSE 0 
    END;
END;
$function$;

-- Fix detect_recurring_errors
CREATE OR REPLACE FUNCTION public.detect_recurring_errors(p_company_id uuid, p_threshold integer)
 RETURNS TABLE(detected boolean, error_count bigint, slow_queries bigint, affected_users text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_slow_count BIGINT;
  v_users TEXT[];
BEGIN
  SELECT 
    COUNT(*),
    ARRAY_AGG(DISTINCT user_name)
  INTO v_slow_count, v_users
  FROM v_agent_conversations
  WHERE root_company_id = p_company_id
    AND created_at >= CURRENT_DATE
    AND response_time_ms > 5000;
  
  RETURN QUERY SELECT 
    (v_slow_count >= p_threshold)::BOOLEAN,
    v_slow_count,
    v_slow_count,
    COALESCE(v_users, ARRAY[]::TEXT[]);
END;
$function$;

-- Fix detect_inactive_users
CREATE OR REPLACE FUNCTION public.detect_inactive_users(p_company_id uuid, p_days_threshold integer)
 RETURNS TABLE(detected boolean, inactive_count bigint, inactive_users jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_inactive JSONB;
  v_count BIGINT;
BEGIN
  SELECT 
    JSONB_AGG(user_data),
    COUNT(*)
  INTO v_inactive, v_count
  FROM (
    SELECT JSONB_BUILD_OBJECT(
      'user_id', p.id,
      'user_name', p.full_name,
      'user_email', p.email,
      'last_usage', COALESCE(MAX(vc.created_at)::TEXT, 'Nunca usou'),
      'days_inactive', COALESCE(EXTRACT(DAY FROM (NOW() - MAX(vc.created_at))), 999)
    ) as user_data
    FROM profiles p
    LEFT JOIN v_agent_conversations vc ON p.id = vc.user_id
    WHERE p.root_company_id = p_company_id
      AND p.has_system_access = true
      AND (vc.created_at IS NULL OR vc.created_at < NOW() - (p_days_threshold || ' days')::INTERVAL)
    GROUP BY p.id, p.full_name, p.email
  ) inactive_data;
  
  RETURN QUERY SELECT 
    (COALESCE(v_count, 0) > 0)::BOOLEAN,
    COALESCE(v_count, 0),
    COALESCE(v_inactive, '[]'::JSONB);
END;
$function$;

-- Fix detect_token_overconsumption
CREATE OR REPLACE FUNCTION public.detect_token_overconsumption(p_company_id uuid, p_monthly_limit bigint, p_threshold_percentage numeric)
 RETURNS TABLE(detected boolean, tokens_used bigint, tokens_limit bigint, percentage_used numeric, days_elapsed integer, projected_total numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_month_start DATE := DATE_TRUNC('month', CURRENT_DATE);
  v_days_in_month INTEGER := EXTRACT(DAY FROM DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month') - INTERVAL '1 day');
  v_days_elapsed INTEGER := EXTRACT(DAY FROM CURRENT_DATE) - EXTRACT(DAY FROM v_month_start) + 1;
  v_tokens_used BIGINT;
  v_percentage NUMERIC;
  v_projection NUMERIC;
BEGIN
  SELECT COALESCE(SUM(tokens_used), 0)
  INTO v_tokens_used
  FROM v_agent_conversations
  WHERE root_company_id = p_company_id
    AND created_at >= v_month_start;
  
  v_percentage := (v_tokens_used::NUMERIC / p_monthly_limit) * 100;
  v_projection := (v_tokens_used::NUMERIC / v_days_elapsed) * v_days_in_month;
  
  RETURN QUERY SELECT 
    (v_percentage >= p_threshold_percentage)::BOOLEAN,
    v_tokens_used,
    p_monthly_limit,
    v_percentage,
    v_days_elapsed,
    v_projection;
END;
$function$;

-- Fix detect_after_hours_usage
CREATE OR REPLACE FUNCTION public.detect_after_hours_usage(p_company_id uuid, p_threshold integer)
 RETURNS TABLE(detected boolean, after_hours_count bigint, queries_detail jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_count BIGINT;
  v_detail JSONB;
BEGIN
  SELECT 
    COUNT(*),
    JSONB_AGG(JSONB_BUILD_OBJECT(
      'user_name', user_name,
      'timestamp', created_at,
      'agent_type', agent_type,
      'hour', EXTRACT(HOUR FROM created_at)
    ))
  INTO v_count, v_detail
  FROM v_agent_conversations
  WHERE root_company_id = p_company_id
    AND created_at >= CURRENT_DATE
    AND (
      EXTRACT(HOUR FROM created_at) >= 22 OR 
      EXTRACT(HOUR FROM created_at) < 6 OR
      EXTRACT(DOW FROM created_at) IN (0, 6)
    );
  
  RETURN QUERY SELECT 
    (COALESCE(v_count, 0) >= p_threshold)::BOOLEAN,
    COALESCE(v_count, 0),
    COALESCE(v_detail, '[]'::JSONB);
END;
$function$;

-- Fix detect_user_concentration
CREATE OR REPLACE FUNCTION public.detect_user_concentration(p_company_id uuid, p_threshold numeric)
 RETURNS TABLE(detected boolean, top_user_name text, top_user_count bigint, total_count bigint, concentration_percentage numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_top_user_name TEXT;
  v_top_count BIGINT;
  v_total BIGINT;
  v_percentage NUMERIC;
BEGIN
  SELECT 
    user_name,
    COUNT(*) as user_count
  INTO v_top_user_name, v_top_count
  FROM v_agent_conversations
  WHERE root_company_id = p_company_id
    AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
  GROUP BY user_name
  ORDER BY COUNT(*) DESC
  LIMIT 1;
  
  SELECT COUNT(*)
  INTO v_total
  FROM v_agent_conversations
  WHERE root_company_id = p_company_id
    AND created_at >= DATE_TRUNC('month', CURRENT_DATE);
  
  v_percentage := (v_top_count::NUMERIC / NULLIF(v_total, 0)) * 100;
  
  RETURN QUERY SELECT 
    (COALESCE(v_percentage, 0) >= p_threshold)::BOOLEAN,
    COALESCE(v_top_user_name, 'N/A'),
    COALESCE(v_top_count, 0),
    COALESCE(v_total, 0),
    COALESCE(v_percentage, 0);
END;
$function$;

-- Fix validate_single_company_per_user
CREATE OR REPLACE FUNCTION public.validate_single_company_per_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_user_id UUID;
  v_company_count INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  IF NEW.type = 'company' AND TG_OP = 'INSERT' THEN
    SELECT COUNT(*) INTO v_company_count
    FROM organizational_structure
    WHERE type = 'company'
    AND id IN (
      SELECT root_company_id FROM profiles WHERE id = v_user_id
    );
    
    IF v_company_count > 0 THEN
      RAISE EXCEPTION 'Você já possui uma empresa cadastrada. Para adicionar localizações, crie Matriz ou Filial.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix validate_company_no_parent
CREATE OR REPLACE FUNCTION public.validate_company_no_parent()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  IF NEW.type = 'company' AND NEW.parent_id IS NOT NULL THEN
    RAISE EXCEPTION 'Empresa principal não pode ter entidade pai';
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix update_updated_at_column_v2
CREATE OR REPLACE FUNCTION public.update_updated_at_column_v2()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;