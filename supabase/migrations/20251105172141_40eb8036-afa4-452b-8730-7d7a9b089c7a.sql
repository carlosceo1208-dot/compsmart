-- Criar função para recalcular salary_range_percentage
CREATE OR REPLACE FUNCTION recalculate_salary_range_percentages()
RETURNS TABLE(
  employee_name TEXT,
  employee_grade TEXT,
  old_percentage NUMERIC,
  new_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  emp RECORD;
  range RECORD;
  percentage NUMERIC;
  old_perc NUMERIC;
  padded_grade TEXT;
  active_table_id UUID;
BEGIN
  -- Buscar tabela ativa
  SELECT id INTO active_table_id
  FROM salary_tables
  WHERE is_active = true
  LIMIT 1;
  
  IF active_table_id IS NULL THEN
    RAISE NOTICE 'Nenhuma tabela salarial ativa encontrada';
    RETURN;
  END IF;
  
  -- Processar cada funcionário com salário e grade definidos
  FOR emp IN 
    SELECT id, full_name, salary, grade, salary_range_percentage
    FROM profiles 
    WHERE salary IS NOT NULL 
      AND grade IS NOT NULL
  LOOP
    old_perc := emp.salary_range_percentage;
    
    -- Padronizar grade com 3 dígitos
    padded_grade := LPAD(emp.grade::TEXT, 3, '0');
    
    -- Buscar faixa salarial
    SELECT min_value, median_value, max_value 
    INTO range
    FROM salary_ranges
    WHERE grade = padded_grade
      AND salary_table_id = active_table_id
    LIMIT 1;
    
    IF FOUND THEN
      -- Calcular percentual com a fórmula correta de 3 casos
      IF emp.salary < range.min_value THEN
        -- CASO 1: Abaixo do mínimo
        percentage := ((emp.salary - range.min_value) / range.min_value) * 100;
      ELSIF emp.salary >= range.min_value AND emp.salary <= range.max_value THEN
        -- CASO 2: Dentro da faixa (comparar com ponto médio = mercado)
        percentage := (emp.salary / range.median_value) * 100;
      ELSE
        -- CASO 3: Acima do máximo
        percentage := (emp.salary / range.max_value) * 100;
      END IF;
      
      -- Atualizar registro
      UPDATE profiles 
      SET salary_range_percentage = ROUND(percentage, 2)
      WHERE id = emp.id;
      
      -- Retornar resultado para análise
      employee_name := emp.full_name;
      employee_grade := emp.grade;
      old_percentage := old_perc;
      new_percentage := ROUND(percentage, 2);
      RETURN NEXT;
    ELSE
      RAISE WARNING 'Faixa salarial não encontrada para % (Grade %)', 
                    emp.full_name, padded_grade;
    END IF;
  END LOOP;
END;
$$;