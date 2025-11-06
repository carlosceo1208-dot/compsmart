-- Atualizar a função recalculate_salary_range_percentages() com a fórmula corrigida
CREATE OR REPLACE FUNCTION public.recalculate_salary_range_percentages()
 RETURNS TABLE(employee_id uuid, employee_name text, employee_grade text, salary numeric, range_info text, old_percentage numeric, new_percentage numeric, status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  emp RECORD;
  range RECORD;
  percentage numeric;
BEGIN
  FOR emp IN 
    SELECT 
      p.id,
      p.full_name,
      p.grade,
      p.salary,
      p.job_title_id,
      p.salary_range_percentage as old_percentage
    FROM profiles p
    WHERE p.salary IS NOT NULL 
      AND p.job_title_id IS NOT NULL
  LOOP
    SELECT 
      sr.min_value,
      sr.median_value,
      sr.max_value
    INTO range
    FROM job_titles jt
    JOIN salary_ranges sr ON jt.salary_range_id = sr.id
    WHERE jt.id = emp.job_title_id;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    -- ===== FÓRMULAS CORRETAS =====
    
    -- CASO 1: Abaixo do mínimo (% NEGATIVO de aumento necessário)
    IF emp.salary < range.min_value THEN
      percentage := -((range.min_value / emp.salary) - 1) * 100;
    
    -- CASO 2: Dentro da faixa (0-100%, onde 50% = Média de Mercado)
    ELSIF emp.salary >= range.min_value AND emp.salary <= range.max_value THEN
      percentage := ((emp.salary - range.min_value) / (range.max_value - range.min_value)) * 100;
    
    -- CASO 3: Acima do máximo (percentual em relação ao teto)
    ELSE
      percentage := (emp.salary / range.max_value) * 100;
    END IF;

    UPDATE profiles
    SET salary_range_percentage = percentage
    WHERE id = emp.id;

    RETURN QUERY SELECT 
      emp.id,
      emp.full_name,
      emp.grade,
      emp.salary,
      format('R$ %s - R$ %s', range.min_value, range.max_value),
      emp.old_percentage,
      percentage,
      CASE 
        WHEN emp.salary < range.min_value THEN format('⚠️ Abaixo do Mínimo (%.2f%%)', percentage)
        WHEN percentage < 40 THEN '📊 Início da Faixa (Abaixo do Mercado)'
        WHEN percentage < 60 THEN '✅ Próximo ao Mercado (50% = Mercado)'
        WHEN percentage <= 100 THEN '🔸 Acima do Mercado'
        ELSE '🔴 Acima da Faixa'
      END;
  END LOOP;
END;
$function$;