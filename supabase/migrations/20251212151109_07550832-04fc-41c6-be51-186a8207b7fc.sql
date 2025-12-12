
-- Ativar tabelas salariais das empresas de teste
UPDATE salary_tables SET is_active = true WHERE id = '18886e37-393f-4c54-bf9b-83ad89a49b60'; -- MédiaGrowth
UPDATE salary_tables SET is_active = true WHERE id = '4d0e889d-9d1a-4cb7-8aea-081da5bdc2cb'; -- TechStart

-- Função para calcular salary_range_percentage automaticamente
CREATE OR REPLACE FUNCTION public.calculate_profile_salary_range_percentage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_min_value NUMERIC;
  v_max_value NUMERIC;
  v_percentage NUMERIC;
  v_normalized_grade TEXT;
BEGIN
  -- Só calcular se tiver salary e grade
  IF NEW.salary IS NULL OR NEW.grade IS NULL OR NEW.root_company_id IS NULL THEN
    NEW.salary_range_percentage := NULL;
    RETURN NEW;
  END IF;

  -- Normalizar grade com padding de 3 dígitos
  v_normalized_grade := LPAD(TRIM(NEW.grade), 3, '0');

  -- Buscar faixa salarial da tabela ativa da empresa
  SELECT sr.min_value, sr.max_value
  INTO v_min_value, v_max_value
  FROM salary_ranges sr
  JOIN salary_tables st ON sr.salary_table_id = st.id
  WHERE st.root_company_id = NEW.root_company_id
    AND st.is_active = true
    AND LPAD(TRIM(sr.grade), 3, '0') = v_normalized_grade
  LIMIT 1;

  -- Se não encontrou faixa, deixar NULL
  IF v_min_value IS NULL OR v_max_value IS NULL THEN
    NEW.salary_range_percentage := NULL;
    RETURN NEW;
  END IF;

  -- Calcular percentual conforme fórmula de 3 casos
  IF NEW.salary < v_min_value THEN
    -- CASO 1: Abaixo do mínimo (% negativo de aumento necessário)
    v_percentage := -((v_min_value / NEW.salary) - 1) * 100;
  ELSIF NEW.salary >= v_min_value AND NEW.salary <= v_max_value THEN
    -- CASO 2: Dentro da faixa (0% a 100%, onde 50% = Média de Mercado)
    v_percentage := ((NEW.salary - v_min_value) / (v_max_value - v_min_value)) * 100;
  ELSE
    -- CASO 3: Acima do máximo (percentual em relação ao teto)
    v_percentage := (NEW.salary / v_max_value) * 100;
  END IF;

  NEW.salary_range_percentage := v_percentage;
  RETURN NEW;
END;
$$;

-- Criar trigger para INSERT e UPDATE
DROP TRIGGER IF EXISTS trg_calculate_salary_percentage ON profiles;
CREATE TRIGGER trg_calculate_salary_percentage
  BEFORE INSERT OR UPDATE OF salary, grade, root_company_id
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION calculate_profile_salary_range_percentage();

-- Recalcular para TODOS os funcionários existentes com salary e grade
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
