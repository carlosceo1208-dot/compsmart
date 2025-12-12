-- Trigger que recalcula TODOS os funcionários quando uma tabela salarial é ATIVADA
CREATE OR REPLACE FUNCTION public.recalculate_all_employees_on_table_activation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Só executar quando is_active muda para TRUE
  IF NEW.is_active = true AND (OLD.is_active = false OR OLD.is_active IS NULL) THEN
    -- Recalcular salary_range_percentage para todos funcionários desta empresa
    UPDATE profiles p
    SET salary_range_percentage = (
      SELECT 
        CASE 
          WHEN p.salary < sr.min_value THEN -((sr.min_value / p.salary) - 1) * 100
          WHEN p.salary >= sr.min_value AND p.salary <= sr.max_value THEN ((p.salary - sr.min_value) / (sr.max_value - sr.min_value)) * 100
          ELSE (p.salary / sr.max_value) * 100
        END
      FROM salary_ranges sr
      WHERE sr.salary_table_id = NEW.id
        AND LPAD(TRIM(sr.grade), 3, '0') = LPAD(TRIM(p.grade), 3, '0')
      LIMIT 1
    )
    WHERE p.root_company_id = NEW.root_company_id
      AND p.salary IS NOT NULL 
      AND p.grade IS NOT NULL;
      
    RAISE NOTICE 'Recalculado salary_range_percentage para % funcionários da empresa %', 
      (SELECT COUNT(*) FROM profiles WHERE root_company_id = NEW.root_company_id AND salary IS NOT NULL AND grade IS NOT NULL),
      NEW.root_company_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger na tabela salary_tables
DROP TRIGGER IF EXISTS trg_recalculate_on_table_activation ON salary_tables;
CREATE TRIGGER trg_recalculate_on_table_activation
  AFTER UPDATE OF is_active
  ON salary_tables
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_all_employees_on_table_activation();

-- Forçar recálculo imediato para empresas que já têm tabelas ativas
-- Isso vai "tocar" cada funcionário para acionar o trigger existente de profiles
UPDATE profiles p
SET salary_range_percentage = (
  SELECT 
    CASE 
      WHEN p.salary < sr.min_value THEN -((sr.min_value / p.salary) - 1) * 100
      WHEN p.salary >= sr.min_value AND p.salary <= sr.max_value THEN ((p.salary - sr.min_value) / (sr.max_value - sr.min_value)) * 100
      ELSE (p.salary / sr.max_value) * 100
    END
  FROM salary_ranges sr
  JOIN salary_tables st ON sr.salary_table_id = st.id
  WHERE st.root_company_id = p.root_company_id
    AND st.is_active = true
    AND LPAD(TRIM(sr.grade), 3, '0') = LPAD(TRIM(p.grade), 3, '0')
  LIMIT 1
)
WHERE p.salary IS NOT NULL 
  AND p.grade IS NOT NULL 
  AND p.root_company_id IS NOT NULL;